/**
 * Tokens visuais do Farroups-pay.
 *
 * A identidade do Colégio Farroupilha é azul e branca, com o vermelho como
 * acento — nunca como cor dominante. Sobre essa base, o app veste três roupas
 * conforme a idade de quem o usa:
 *
 *   infantil     até o 5º ano  — branco e azul bebê, com ilustrações de fundo
 *   padrao       6º ao 9º ano  — azul institucional, branco e vermelho
 *   profissional Ensino Médio  — preto, cinza e branco, com azul-aço discreto
 *
 * Adulto (responsável, lojista, secretaria) usa sempre a paleta padrão.
 */

import type { Segmento } from '@/domain/types';

export type { Segmento };

export const espaco = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const raio = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const duracao = {
  rapida: 180,
  media: 240,
  lenta: 320,
} as const;

export const tipografia = {
  displayGrande: { fontSize: 40, lineHeight: 46, letterSpacing: -1.2, peso: '700' },
  display: { fontSize: 32, lineHeight: 38, letterSpacing: -0.8, peso: '700' },
  titulo: { fontSize: 22, lineHeight: 28, letterSpacing: -0.4, peso: '600' },
  subtitulo: { fontSize: 17, lineHeight: 23, letterSpacing: -0.2, peso: '600' },
  corpo: { fontSize: 15, lineHeight: 21, letterSpacing: 0, peso: '400' },
  corpoForte: { fontSize: 15, lineHeight: 21, letterSpacing: 0, peso: '600' },
  legenda: { fontSize: 13, lineHeight: 18, letterSpacing: 0, peso: '400' },
  micro: { fontSize: 11, lineHeight: 15, letterSpacing: 0.4, peso: '600' },
} as const;

export interface Paleta {
  fundo: string;
  superficie: string;
  superficieAlt: string;
  superficieToque: string;
  texto: string;
  textoSuave: string;
  textoInverso: string;
  borda: string;
  /** Azul institucional — a cor de marca. */
  marca: string;
  /** Fundo de botão sólido: escuro o bastante para texto branco (AA). */
  marcaBotao: string;
  marcaForte: string;
  marcaSuave: string;
  /** Vermelho institucional: usado em doses pequenas. */
  acento: string;
  acentoSuave: string;
  sucesso: string;
  sucessoSuave: string;
  alerta: string;
  alertaSuave: string;
  sombra: string;
  cartaoTopo: string;
  cartaoBase: string;
  esqueleto: string;
  /** Traço das ilustrações de fundo (só a paleta infantil as usa). */
  ilustracao: string;
}

/* ------------------------------------------------------------------
   PADRÃO — 6º ao 9º ano, e todo o público adulto
   ------------------------------------------------------------------ */
const padraoClaro: Paleta = {
  fundo: '#F6F8FC',
  superficie: '#FFFFFF',
  superficieAlt: '#EDF1F8',
  superficieToque: '#E1E8F4',
  texto: '#101828',
  textoSuave: '#5A6474',
  textoInverso: '#FFFFFF',
  borda: 'rgba(16, 24, 40, 0.10)',
  marca: '#14488F',
  marcaBotao: '#14488F',
  marcaForte: '#0E3468',
  marcaSuave: '#E7EFFA',
  acento: '#C4122F',
  acentoSuave: '#FBEAED',
  sucesso: '#0E7C5A',
  sucessoSuave: '#E4F5EE',
  alerta: '#C0392B',
  alertaSuave: '#FDECE8',
  sombra: '#0B1B33',
  cartaoTopo: '#1E5AA8',
  cartaoBase: '#0C2E5C',
  esqueleto: '#E4EAF4',
  ilustracao: 'rgba(20, 72, 143, 0.06)',
};

const padraoEscuro: Paleta = {
  fundo: '#0B1017',
  superficie: '#131A24',
  superficieAlt: '#1B2430',
  superficieToque: '#24303E',
  texto: '#EAF0F8',
  textoSuave: '#93A1B5',
  textoInverso: '#0B1017',
  borda: 'rgba(255, 255, 255, 0.11)',
  marca: '#6BA6EC',
  marcaBotao: '#17539F',
  marcaForte: '#9CC6F6',
  marcaSuave: '#12253E',
  acento: '#F0566B',
  acentoSuave: '#2B1219',
  sucesso: '#3ECF9B',
  sucessoSuave: '#12271F',
  alerta: '#FF7A66',
  alertaSuave: '#2B1512',
  sombra: '#000000',
  cartaoTopo: '#1A4E93',
  cartaoBase: '#08203F',
  esqueleto: '#1D2733',
  ilustracao: 'rgba(107, 166, 236, 0.08)',
};

/* ------------------------------------------------------------------
   INFANTIL — até o 5º ano: branco e azul bebê
   ------------------------------------------------------------------ */
const infantilClaro: Paleta = {
  fundo: '#F1F8FF',
  superficie: '#FFFFFF',
  superficieAlt: '#E3F0FD',
  superficieToque: '#D2E7FB',
  texto: '#123A5E',
  textoSuave: '#5A7E9C',
  textoInverso: '#FFFFFF',
  borda: 'rgba(18, 58, 94, 0.12)',
  marca: '#1F73C7',
  marcaBotao: '#1F73C7',
  marcaForte: '#12518F',
  marcaSuave: '#DCEEFF',
  acento: '#D93A54',
  acentoSuave: '#FDE8EC',
  sucesso: '#0F8A63',
  sucessoSuave: '#DFF5EC',
  alerta: '#D9432F',
  alertaSuave: '#FDEBE7',
  sombra: '#0F3E68',
  cartaoTopo: '#4FA8F0',
  cartaoBase: '#1B69B8',
  esqueleto: '#DCEBF9',
  ilustracao: 'rgba(79, 168, 240, 0.20)',
};

const infantilEscuro: Paleta = {
  fundo: '#0C1723',
  superficie: '#142334',
  superficieAlt: '#1B2F44',
  superficieToque: '#243C55',
  texto: '#E9F3FC',
  textoSuave: '#93AFC9',
  textoInverso: '#0C1723',
  borda: 'rgba(255, 255, 255, 0.12)',
  marca: '#6FBBF5',
  marcaBotao: '#1D6BB8',
  marcaForte: '#A2D5FA',
  marcaSuave: '#14293D',
  acento: '#F4697F',
  acentoSuave: '#2C161C',
  sucesso: '#48D6A3',
  sucessoSuave: '#0F2A21',
  alerta: '#FF8570',
  alertaSuave: '#2C1712',
  sombra: '#000000',
  cartaoTopo: '#3E93D8',
  cartaoBase: '#124372',
  esqueleto: '#1A2C3F',
  ilustracao: 'rgba(111, 187, 245, 0.14)',
};

/* ------------------------------------------------------------------
   PROFISSIONAL — Ensino Médio: preto, cinza e branco
   ------------------------------------------------------------------ */
const profissionalClaro: Paleta = {
  fundo: '#F4F5F6',
  superficie: '#FFFFFF',
  superficieAlt: '#E9EBED',
  superficieToque: '#DCDFE2',
  texto: '#0F1113',
  textoSuave: '#63696F',
  textoInverso: '#FFFFFF',
  borda: 'rgba(15, 17, 19, 0.12)',
  marca: '#1F2429',
  marcaBotao: '#16191D',
  marcaForte: '#000000',
  marcaSuave: '#E7E9EB',
  acento: '#2F6DB4',
  acentoSuave: '#E8EFF7',
  sucesso: '#0B7351',
  sucessoSuave: '#E3F1EB',
  alerta: '#B3352A',
  alertaSuave: '#F7E9E7',
  sombra: '#0F1113',
  cartaoTopo: '#31363C',
  cartaoBase: '#0C0E10',
  esqueleto: '#E4E6E8',
  ilustracao: 'rgba(15, 17, 19, 0.05)',
};

const profissionalEscuro: Paleta = {
  fundo: '#0A0B0C',
  superficie: '#141618',
  superficieAlt: '#1C1F22',
  superficieToque: '#262A2E',
  texto: '#F2F3F4',
  textoSuave: '#9A9FA5',
  textoInverso: '#0A0B0C',
  borda: 'rgba(255, 255, 255, 0.12)',
  marca: '#D8DCE0',
  marcaBotao: '#2B3036',
  marcaForte: '#FFFFFF',
  marcaSuave: '#1B1E21',
  acento: '#6BA3E0',
  acentoSuave: '#131C27',
  sucesso: '#3FCB98',
  sucessoSuave: '#0F2620',
  alerta: '#F07A67',
  alertaSuave: '#2A1512',
  sombra: '#000000',
  cartaoTopo: '#2A2F35',
  cartaoBase: '#08090A',
  esqueleto: '#1E2124',
  ilustracao: 'rgba(255, 255, 255, 0.05)',
};

export const PALETAS: Record<Segmento, { claro: Paleta; escuro: Paleta }> = {
  infantil: { claro: infantilClaro, escuro: infantilEscuro },
  padrao: { claro: padraoClaro, escuro: padraoEscuro },
  profissional: { claro: profissionalClaro, escuro: profissionalEscuro },
};

/** Compatibilidade: a paleta adulta continua sendo a padrão. */
export const claro = padraoClaro;
export const escuro = padraoEscuro;

export const NOME_SEGMENTO: Record<Segmento, string> = {
  infantil: 'Anos iniciais',
  padrao: 'Anos finais',
  profissional: 'Ensino Médio',
};

/** Deriva o segmento a partir da turma, para dados que não o tragam pronto. */
export function segmentoDaTurma(turma: string): Segmento {
  const t = turma.toLowerCase();
  if (t.includes('em') || t.includes('médio') || t.includes('medio')) return 'profissional';
  const ano = Number(t.match(/(\d+)/)?.[1] ?? 0);
  if (ano >= 1 && ano <= 5) return 'infantil';
  return 'padrao';
}

export function sombraCartao(cor: string, escura: boolean) {
  return {
    shadowColor: cor,
    shadowOpacity: escura ? 0.4 : 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  };
}

export function sombraSuave(cor: string, escura: boolean) {
  return {
    shadowColor: cor,
    shadowOpacity: escura ? 0.3 : 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  };
}
