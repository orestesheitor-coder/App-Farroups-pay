import { id } from '@/lib/id';
import type { Lancamento, LinhaLancamento } from './types';

/**
 * Plano de contas simplificado. O colégio é o custodiante: o dinheiro que
 * entra vira passivo com o aluno; ao gastar, o passivo migra do aluno para a
 * loja; o repasse quita o passivo com a loja.
 */
export const CONTAS = {
  caixaPsp: 'ativo:caixa_psp',
  aluno: (contaId: string) => `passivo:aluno:${contaId}`,
  loja: (lojaId: string) => `passivo:loja:${lojaId}`,
} as const;

export function criarLancamento(
  descricao: string,
  transacaoId: string,
  linhas: LinhaLancamento[],
  criadoEm = new Date().toISOString(),
): Lancamento {
  conferir(linhas);
  return { id: id('lcm'), criadoEm, descricao, transacaoId, linhas };
}

/** Recarga: entra dinheiro no caixa e nasce o passivo com o aluno. */
export function lancamentoRecarga(
  contaId: string,
  valorCentavos: number,
  transacaoId: string,
  descricao: string,
): Lancamento {
  return criarLancamento(descricao, transacaoId, [
    { conta: CONTAS.caixaPsp, tipo: 'D', valorCentavos },
    { conta: CONTAS.aluno(contaId), tipo: 'C', valorCentavos },
  ]);
}

/** Compra: o passivo sai do aluno e vira passivo com a loja. */
export function lancamentoCompra(
  contaId: string,
  lojaId: string,
  valorCentavos: number,
  transacaoId: string,
  descricao: string,
): Lancamento {
  return criarLancamento(descricao, transacaoId, [
    { conta: CONTAS.aluno(contaId), tipo: 'D', valorCentavos },
    { conta: CONTAS.loja(lojaId), tipo: 'C', valorCentavos },
  ]);
}

/** Estorno: lançamento novo e inverso — nada é apagado do ledger. */
export function lancamentoEstorno(
  contaId: string,
  lojaId: string,
  valorCentavos: number,
  transacaoId: string,
  descricao: string,
): Lancamento {
  return criarLancamento(descricao, transacaoId, [
    { conta: CONTAS.loja(lojaId), tipo: 'D', valorCentavos },
    { conta: CONTAS.aluno(contaId), tipo: 'C', valorCentavos },
  ]);
}

/** Repasse à loja: quita o passivo e sai dinheiro do caixa. */
export function lancamentoRepasse(
  lojaId: string,
  valorCentavos: number,
  transacaoId: string,
): Lancamento {
  return criarLancamento(`Repasse ${lojaId}`, transacaoId, [
    { conta: CONTAS.loja(lojaId), tipo: 'D', valorCentavos },
    { conta: CONTAS.caixaPsp, tipo: 'C', valorCentavos },
  ]);
}

export function saldoDaConta(lancamentos: Lancamento[], conta: string): number {
  return lancamentos
    .flatMap((l) => l.linhas)
    .filter((l) => l.conta === conta)
    .reduce((s, l) => s + (l.tipo === 'C' ? l.valorCentavos : -l.valorCentavos), 0);
}

/** Soma de tudo que o colégio guarda em nome dos alunos. */
export function saldoEmCustodia(lancamentos: Lancamento[]): number {
  return lancamentos
    .flatMap((l) => l.linhas)
    .filter((l) => l.conta.startsWith('passivo:aluno:'))
    .reduce((s, l) => s + (l.tipo === 'C' ? l.valorCentavos : -l.valorCentavos), 0);
}

function conferir(linhas: LinhaLancamento[]): void {
  const debitos = linhas.filter((l) => l.tipo === 'D').reduce((s, l) => s + l.valorCentavos, 0);
  const creditos = linhas.filter((l) => l.tipo === 'C').reduce((s, l) => s + l.valorCentavos, 0);
  if (debitos !== creditos) {
    throw new Error(`Lançamento desbalanceado: D ${debitos} != C ${creditos}`);
  }
  if (linhas.some((l) => !Number.isInteger(l.valorCentavos) || l.valorCentavos <= 0)) {
    throw new Error('Lançamento com valor inválido');
  }
}
