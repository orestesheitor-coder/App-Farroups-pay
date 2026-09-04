import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTema } from '@/theme';

/** Marca do app: um "F" geométrico recortado sobre o vermelho institucional. */
export function MarcaFarroups({ tamanho = 40 }: { tamanho?: number }) {
  const { cores } = useTema();
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 64 64">
      <Rect x="0" y="0" width="64" height="64" rx="18" fill={cores.marca} />
      <Path
        d="M22 17h22v7.5H29.5v7H42V39H29.5v10H22z"
        fill="#FFFFFF"
      />
      <Path d="M22 49h7.5v-10H22z" fill="rgba(255,255,255,0.55)" />
    </Svg>
  );
}
