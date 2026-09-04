/**
 * Formatação pt-BR. Todos os valores monetários circulam no app como
 * inteiros em centavos — nunca como float — para evitar erro de arredondamento.
 */

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

/** 1234 -> "R$ 12,34" */
export function formatarReais(centavos: number): string {
  return moeda.format(centavos / 100).replace(/ /g, ' ');
}

/** 1234 -> "12,34" (sem o símbolo, para composições tipográficas) */
export function formatarValor(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** "12,34" | "1234" | "R$ 12,34" -> 1234 centavos */
export function parseCentavos(entrada: string): number {
  const limpo = entrada.replace(/[^\d]/g, '');
  if (!limpo) return 0;
  return parseInt(limpo, 10);
}

/** Máscara de digitação de valor: cada dígito empurra as casas decimais. */
export function mascaraValor(digitos: string): string {
  const centavos = parseCentavos(digitos);
  return formatarValor(centavos);
}

export function formatarData(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(d);
}

export function formatarHora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
}

export function formatarDataHora(iso: string): string {
  return `${formatarData(iso)} às ${formatarHora(iso)}`;
}

/** "Hoje", "Ontem" ou "12/03/2026" — usado nos cabeçalhos do extrato. */
export function rotuloDoDia(iso: string, agora = new Date()): string {
  const dia = diaSP(iso);
  const hoje = diaSP(agora.toISOString());
  const ontem = diaSP(new Date(agora.getTime() - 86400000).toISOString());
  if (dia === hoje) return 'Hoje';
  if (dia === ontem) return 'Ontem';
  return formatarData(iso);
}

/** Dia civil em America/Sao_Paulo no formato AAAA-MM-DD. */
export function diaSP(iso: string | Date = new Date()): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const partes = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(d);
  return partes;
}

/** AAAA-MM de referência para os gráficos mensais. */
export function mesSP(iso: string | Date = new Date()): string {
  return diaSP(iso).slice(0, 7);
}

export function nomeDoMes(mes: string): string {
  const [ano, m] = mes.split('-');
  const d = new Date(Number(ano), Number(m) - 1, 1);
  const nome = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(d);
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(' ')[0] ?? nome;
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(' ').filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** Percentual com sinal, para o comparativo mensal. */
export function variacao(atual: number, anterior: number): string | null {
  if (anterior === 0) return null;
  const pct = Math.round(((atual - anterior) / anterior) * 100);
  return `${pct > 0 ? '+' : ''}${pct}%`;
}
