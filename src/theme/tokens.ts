/**
 * Tokens visuais. A identidade do Farroupilha é vermelha e branca: o vermelho
 * aparece em doses pequenas (marca, cartão, CTA), o resto respira em neutros.
 */

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
  marca: string;
  /** Fundo de botão sólido: sempre escuro o bastante para texto branco (AA). */
  marcaBotao: string;
  marcaForte: string;
  marcaSuave: string;
  sucesso: string;
  sucessoSuave: string;
  alerta: string;
  alertaSuave: string;
  sombra: string;
  cartaoTopo: string;
  cartaoBase: string;
  esqueleto: string;
}

export const claro: Paleta = {
  fundo: '#FAFAF8',
  superficie: '#FFFFFF',
  superficieAlt: '#F1F1ED',
  superficieToque: '#E9E9E4',
  texto: '#14161A',
  textoSuave: '#6B7076',
  textoInverso: '#FFFFFF',
  borda: 'rgba(20, 22, 26, 0.08)',
  marca: '#C4122F',
  marcaBotao: '#C4122F',
  marcaForte: '#9E0E26',
  marcaSuave: '#FBECEE',
  sucesso: '#0E7C5A',
  sucessoSuave: '#E4F5EE',
  alerta: '#C0392B',
  alertaSuave: '#FDECE8',
  sombra: '#14161A',
  cartaoTopo: '#C4122F',
  cartaoBase: '#7E0A1E',
  esqueleto: '#E9E9E4',
};

export const escuro: Paleta = {
  fundo: '#0E0F12',
  superficie: '#17191E',
  superficieAlt: '#1F222A',
  superficieToque: '#282C35',
  texto: '#F4F4F1',
  textoSuave: '#9AA0A8',
  textoInverso: '#14161A',
  borda: 'rgba(255, 255, 255, 0.10)',
  marca: '#F0455C',
  marcaBotao: '#C81433',
  marcaForte: '#FF6B7D',
  marcaSuave: '#2A1218',
  sucesso: '#3ECF9B',
  sucessoSuave: '#12271F',
  alerta: '#FF7A66',
  alertaSuave: '#2B1512',
  sombra: '#000000',
  cartaoTopo: '#B9152F',
  cartaoBase: '#5E0716',
  esqueleto: '#22252C',
};

export function sombraCartao(cor: string, escura: boolean) {
  return {
    shadowColor: cor,
    shadowOpacity: escura ? 0.4 : 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  };
}

export function sombraSuave(cor: string, escura: boolean) {
  return {
    shadowColor: cor,
    shadowOpacity: escura ? 0.3 : 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  };
}
