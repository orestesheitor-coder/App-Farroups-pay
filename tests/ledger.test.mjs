import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTAS,
  criarLancamento,
  lancamentoCompra,
  lancamentoEstorno,
  lancamentoRecarga,
  lancamentoRepasse,
  saldoDaConta,
  saldoEmCustodia,
} from '@/domain/ledger.ts';

test('todo lançamento fecha débito com crédito', () => {
  const l = lancamentoRecarga('cta_1', 5000, 'trx_1', 'Recarga via Pix');
  const debitos = l.linhas.filter((x) => x.tipo === 'D').reduce((s, x) => s + x.valorCentavos, 0);
  const creditos = l.linhas.filter((x) => x.tipo === 'C').reduce((s, x) => s + x.valorCentavos, 0);
  assert.equal(debitos, creditos);
});

test('lançamento desbalanceado é rejeitado', () => {
  assert.throws(
    () =>
      criarLancamento('quebrado', 'trx', [
        { conta: 'a', tipo: 'D', valorCentavos: 100 },
        { conta: 'b', tipo: 'C', valorCentavos: 90 },
      ]),
    /desbalanceado/,
  );
});

test('recarga, compra e estorno mantêm o saldo do aluno coerente', () => {
  const livro = [
    lancamentoRecarga('cta_1', 10000, 't1', 'Recarga'),
    lancamentoCompra('cta_1', 'bar-do-ze', 1800, 't2', 'Bar do Zé'),
  ];
  assert.equal(saldoDaConta(livro, CONTAS.aluno('cta_1')), 8200);
  assert.equal(saldoDaConta(livro, CONTAS.loja('bar-do-ze')), 1800);

  livro.push(lancamentoEstorno('cta_1', 'bar-do-ze', 1800, 't3', 'Estorno'));
  assert.equal(saldoDaConta(livro, CONTAS.aluno('cta_1')), 10000);
  assert.equal(saldoDaConta(livro, CONTAS.loja('bar-do-ze')), 0);
  assert.equal(livro.length, 3, 'o estorno cria um lançamento novo, não apaga o anterior');
});

test('saldo em custódia soma o passivo com todos os alunos', () => {
  const livro = [
    lancamentoRecarga('cta_1', 10000, 't1', 'Recarga'),
    lancamentoRecarga('cta_2', 5000, 't2', 'Recarga'),
    lancamentoCompra('cta_1', 'la-brunita', 1200, 't3', 'La Brunita'),
  ];
  assert.equal(saldoEmCustodia(livro), 13800);
});

test('repasse à loja quita o passivo e sai do caixa', () => {
  const livro = [
    lancamentoRecarga('cta_1', 10000, 't1', 'Recarga'),
    lancamentoCompra('cta_1', 'saude-no-copo', 1900, 't2', 'Saúde no Copo'),
    lancamentoRepasse('saude-no-copo', 1900, 't3'),
  ];
  assert.equal(saldoDaConta(livro, CONTAS.loja('saude-no-copo')), 0);
  assert.equal(saldoDaConta(livro, CONTAS.caixaPsp), -8100);
});
