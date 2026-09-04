import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  avaliarPagamento,
  exigeAutenticacao,
  gastoNoDia,
  lojaAberta,
  podeEstornar,
  validarRecarga,
} from '@/domain/regras.ts';
import { LOJAS } from '@/services/mock/seed.ts';

const MEIO_DIA_SP = new Date('2026-03-10T15:00:00Z'); // 12:00 em São Paulo
const MADRUGADA_SP = new Date('2026-03-10T04:00:00Z'); // 01:00 em São Paulo

const barDoZe = LOJAS[0];

function contexto(sobrescrever = {}) {
  return {
    conta: {
      id: 'cta_1',
      alunoId: 'alu_1',
      saldoCentavos: 10000,
      ativa: true,
      limites: {
        diarioCentavos: 5000,
        porTransacaoCentavos: 3000,
        lojasBloqueadas: [],
      },
      recargaAutomatica: null,
    },
    cartao: {
      id: 'crt_1',
      contaId: 'cta_1',
      tipo: 'virtual',
      ultimos4: '4417',
      titular: 'ALUNA TESTE',
      turma: '8º ano A',
      bloqueado: false,
      ativo: true,
      criadoEm: '2026-01-01T00:00:00Z',
    },
    loja: barDoZe,
    valorCentavos: 1000,
    gastoNoDiaCentavos: 0,
    agora: MEIO_DIA_SP,
    ...sobrescrever,
  };
}

test('aprova compra dentro do saldo e dos limites', () => {
  const r = avaliarPagamento(contexto());
  assert.equal(r.ok, true);
  assert.equal(r.exigeAutenticacao, false);
});

test('pede PIN acima de R$ 50,00', () => {
  const r = avaliarPagamento(contexto({ valorCentavos: 5001, gastoNoDiaCentavos: 0, conta: { ...contexto().conta, limites: { diarioCentavos: 20000, porTransacaoCentavos: 20000, lojasBloqueadas: [] } } }));
  assert.equal(r.ok, true);
  assert.equal(r.exigeAutenticacao, true);
  assert.equal(exigeAutenticacao(5000), false);
});

test('recusa por saldo insuficiente dizendo quanto falta', () => {
  const ctx = contexto({ valorCentavos: 1350 });
  ctx.conta.saldoCentavos = 1000;
  const r = avaliarPagamento(ctx);
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'saldo_insuficiente');
  assert.match(r.mensagem, /faltam R\$\s?3,50/);
});

test('recusa quando o limite diário já foi consumido', () => {
  const r = avaliarPagamento(contexto({ valorCentavos: 1000, gastoNoDiaCentavos: 4550 }));
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'limite_diario');
  assert.match(r.mensagem, /restam R\$\s?4,50/);
});

test('recusa acima do limite por transação', () => {
  const r = avaliarPagamento(contexto({ valorCentavos: 3500 }));
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'limite_transacao');
});

test('cartão bloqueado impede a compra imediatamente', () => {
  const ctx = contexto();
  ctx.cartao.bloqueado = true;
  const r = avaliarPagamento(ctx);
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'cartao_bloqueado');
  assert.match(r.mensagem, /Desbloqueie/);
});

test('loja bloqueada pelo responsável recusa com nome da loja', () => {
  const ctx = contexto();
  ctx.conta.limites.lojasBloqueadas = ['bar-do-ze'];
  const r = avaliarPagamento(ctx);
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'loja_bloqueada_responsavel');
  assert.match(r.mensagem, /Bar do Zé/);
});

test('estabelecimento fora da rede é sempre recusado', () => {
  const r = avaliarPagamento(contexto({ loja: undefined }));
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'loja_nao_autorizada');
});

test('loja fechada recusa e informa o horário de abertura', () => {
  const r = avaliarPagamento(contexto({ agora: MADRUGADA_SP }));
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'loja_fechada');
  assert.equal(lojaAberta(barDoZe, MADRUGADA_SP), false);
  assert.equal(lojaAberta(barDoZe, MEIO_DIA_SP), true);
});

test('conta inativa recusa antes de qualquer checagem de saldo', () => {
  const ctx = contexto({ valorCentavos: 999999 });
  ctx.conta.ativa = false;
  const r = avaliarPagamento(ctx);
  assert.equal(r.motivo, 'conta_inativa');
});

test('gasto do dia soma só débitos aprovados do dia em São Paulo', () => {
  const transacoes = [
    { id: '1', contaId: 'cta_1', tipo: 'debito', status: 'aprovada', valorCentavos: 1000, criadaEm: '2026-03-10T15:00:00Z', descricao: '', chaveIdempotencia: '1' },
    { id: '2', contaId: 'cta_1', tipo: 'debito', status: 'recusada', valorCentavos: 9900, criadaEm: '2026-03-10T16:00:00Z', descricao: '', chaveIdempotencia: '2' },
    { id: '3', contaId: 'cta_1', tipo: 'credito', status: 'aprovada', valorCentavos: 5000, criadaEm: '2026-03-10T16:00:00Z', descricao: '', chaveIdempotencia: '3' },
    { id: '4', contaId: 'cta_2', tipo: 'debito', status: 'aprovada', valorCentavos: 700, criadaEm: '2026-03-10T16:00:00Z', descricao: '', chaveIdempotencia: '4' },
    // 03:00 UTC do dia 11 ainda é 00:00 do dia 11 em São Paulo: já é outro dia
    { id: '5', contaId: 'cta_1', tipo: 'debito', status: 'aprovada', valorCentavos: 500, criadaEm: '2026-03-11T03:00:00Z', descricao: '', chaveIdempotencia: '5' },
  ];
  assert.equal(gastoNoDia(transacoes, 'cta_1', MEIO_DIA_SP), 1000);
});

test('estorno só dentro da janela de 24 horas', () => {
  const base = { id: 't', contaId: 'c', tipo: 'debito', status: 'aprovada', valorCentavos: 100, descricao: '', chaveIdempotencia: 'x' };
  const agora = new Date('2026-03-10T15:00:00Z');
  assert.equal(podeEstornar({ ...base, criadaEm: '2026-03-10T10:00:00Z' }, agora), true);
  assert.equal(podeEstornar({ ...base, criadaEm: '2026-03-08T10:00:00Z' }, agora), false);
  assert.equal(
    podeEstornar({ ...base, status: 'estornada', criadaEm: '2026-03-10T10:00:00Z' }, agora),
    false,
  );
});

test('recarga respeita mínimo e máximo', () => {
  assert.equal(validarRecarga(5000), null);
  assert.match(validarRecarga(100), /mínimo/);
  assert.match(validarRecarga(200000), /máximo/);
});
