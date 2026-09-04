import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { raio, sombraCartao, useTema } from '@/theme';

export interface PropsSuperficie extends ViewProps {
  preenchimento?: number;
  arredondamento?: number;
  variante?: 'elevada' | 'plana' | 'contornada';
}

export function Superficie({
  preenchimento = 16,
  arredondamento = raio.lg,
  variante = 'elevada',
  style,
  ...props
}: PropsSuperficie) {
  const { cores, escura } = useTema();
  const estilo: ViewStyle = {
    backgroundColor: variante === 'plana' ? cores.superficieAlt : cores.superficie,
    borderRadius: arredondamento,
    padding: preenchimento,
    ...(variante === 'elevada' ? sombraCartao(cores.sombra, escura) : null),
    ...(variante === 'contornada'
      ? { borderWidth: 1, borderColor: cores.borda, backgroundColor: 'transparent' }
      : null),
  };
  return <View {...props} style={[estilo, style]} />;
}
