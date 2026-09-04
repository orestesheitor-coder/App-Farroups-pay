import { diaSP, formatarReais } from '@/lib/format';
import type {
  Cartao,
  Conta,
  Loja,
  LojaId,
  MotivoRecusa,
  Transacao,
} from './types';

/** Acima deste valor o aluno precisa confirmar com PIN ou biometria. */
export const LIMITE_SEM_PIN_CENTAVOS = 5000;

/** Janela em que o lojista ainda pode estornar uma venda. */
export const JANELA_ESTORNO_HORAS = 24;

/** Valores rápidos oferecidos na tela de recarga. */
export const VALORES_RAPIDOS = [2000, 5000, 10000, 20000];

/** Limite diário padrão de um aluno recém-cadastrado. */
export const LIMITE_DIARIO_PADRAO = 5000;
export const LIMITE_TRANSACAO_PADRAO = 3000;

export const RECARGA_MINIMA_CENTAVOS = 500;
export const RECARGA_MAXIMA_CENTAVOS = 100000;

export interface ContextoPagamento {
  conta: Conta;
  cartao: Cartao | null;
  loja: Loja | undefined;
  valorCentavos: number;
  gastoNoDiaCentavos: number;
  agora?: Date;
}

export type Avaliacao =
  | { ok: true; exigeAutenticacao: boolean }
  | { ok: false; motivo: MotivoRecusa; mensagem: string };

/**
 * Autoriza (ou recusa) um pagamento. A ordem das checagens importa: recusas
 * mais estruturais vêm antes das de saldo, para que a mensagem exibida ao
 * aluno seja a mais útil possível.
 */
export function avaliarPagamento(ctx: ContextoPagamento): Avaliacao {
  const { conta, cartao, loja, valorCentavos } = ctx;
  const agora = ctx.agora ?? new Date();

  if (!Number.isInteger(valorCentavos) || valorCentavos <= 0) {
    return {
      ok: false,
      motivo: 'valor_invalido',
      mensagem: 'Valor inválido. Peça para o caixa lançar a cobrança de novo.',
    };
  }

  if (!conta.ativa) {
    return {
      ok: false,
      motivo: 'conta_inativa',
      mensagem: 'Conta inativa. Procure a secretaria do colégio.',
    };
  }

  if (!cartao || !cartao.ativo) {
    return {
      ok: false,
      motivo: 'cartao_bloqueado',
      mensagem: 'Nenhum cartão ativo nesta conta.',
    };
  }

  if (cartao.bloqueado) {
    return {
      ok: false,
      motivo: 'cartao_bloqueado',
      mensagem: 'Cartão bloqueado. Desbloqueie no app para voltar a pagar.',
    };
  }

  if (!loja || !loja.autorizada) {
    return {
      ok: false,
      motivo: 'loja_nao_autorizada',
      mensagem: 'Estabelecimento fora da rede Farroups-pay.',
    };
  }

  if (conta.limites.lojasBloqueadas.includes(loja.id)) {
    return {
      ok: false,
      motivo: 'loja_bloqueada_responsavel',
      mensagem: `Compras no ${loja.nome} foram bloqueadas pelo responsável.`,
    };
  }

  if (!lojaAberta(loja, agora)) {
    return {
      ok: false,
      motivo: 'loja_fechada',
      mensagem: `${loja.nome} está fechado agora. Abre às ${loja.abre}.`,
    };
  }

  if (valorCentavos > conta.limites.porTransacaoCentavos) {
    return {
      ok: false,
      motivo: 'limite_transacao',
      mensagem: `Acima do limite por compra de ${formatarReais(
        conta.limites.porTransacaoCentavos,
      )}.`,
    };
  }

  const restanteHoje = Math.max(
    0,
    conta.limites.diarioCentavos - ctx.gastoNoDiaCentavos,
  );
  if (valorCentavos > restanteHoje) {
    return {
      ok: false,
      motivo: 'limite_diario',
      mensagem:
        restanteHoje === 0
          ? `Limite diário de ${formatarReais(
              conta.limites.diarioCentavos,
            )} atingido. Ele é renovado à meia-noite.`
          : `Limite diário atingido — restam ${formatarReais(
              restanteHoje,
            )} para hoje.`,
    };
  }

  if (valorCentavos > conta.saldoCentavos) {
    const falta = valorCentavos - conta.saldoCentavos;
    return {
      ok: false,
      motivo: 'saldo_insuficiente',
      mensagem: `Saldo insuficiente — faltam ${formatarReais(falta)}.`,
    };
  }

  return { ok: true, exigeAutenticacao: valorCentavos > LIMITE_SEM_PIN_CENTAVOS };
}

/** Loja aberta considerando o relógio de Brasília. */
export function lojaAberta(loja: Loja, agora = new Date()): boolean {
  const hhmm = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  }).format(agora);
  return hhmm >= loja.abre && hhmm < loja.fecha;
}

/** Soma dos débitos aprovados do aluno no dia civil de São Paulo. */
export function gastoNoDia(
  transacoes: Transacao[],
  contaId: string,
  referencia: string | Date = new Date(),
): number {
  const dia = diaSP(referencia);
  return transacoes
    .filter(
      (t) =>
        t.contaId === contaId &&
        t.status === 'aprovada' &&
        t.tipo === 'debito' &&
        diaSP(t.criadaEm) === dia,
    )
    .reduce((soma, t) => soma + t.valorCentavos, 0);
}

/** Um estorno devolve saldo ao app — nunca ao meio de pagamento original. */
export function podeEstornar(t: Transacao, agora = new Date()): boolean {
  if (t.tipo !== 'debito' || t.status !== 'aprovada') return false;
  const horas = (agora.getTime() - new Date(t.criadaEm).getTime()) / 3600000;
  return horas <= JANELA_ESTORNO_HORAS;
}

export function exigeAutenticacao(valorCentavos: number): boolean {
  return valorCentavos > LIMITE_SEM_PIN_CENTAVOS;
}

export function validarRecarga(valorCentavos: number): string | null {
  if (valorCentavos < RECARGA_MINIMA_CENTAVOS) {
    return `O valor mínimo de recarga é ${formatarReais(RECARGA_MINIMA_CENTAVOS)}.`;
  }
  if (valorCentavos > RECARGA_MAXIMA_CENTAVOS) {
    return `O valor máximo por recarga é ${formatarReais(RECARGA_MAXIMA_CENTAVOS)}.`;
  }
  return null;
}

export const LOJAS_AUTORIZADAS: LojaId[] = ['bar-do-ze', 'la-brunita', 'saude-no-copo'];
