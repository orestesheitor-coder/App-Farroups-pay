import React from 'react';
import { Text as TextoRN, type TextProps, type TextStyle } from 'react-native';
import { tipografia, useTema } from '@/theme';

type Variante = keyof typeof tipografia;

export interface PropsTexto extends TextProps {
  variante?: Variante;
  cor?: string;
  suave?: boolean;
  peso?: '400' | '500' | '600' | '700';
  centro?: boolean;
  /** Números tabulares: mantém o valor estável enquanto muda. */
  tabular?: boolean;
}

export function Texto({
  variante = 'corpo',
  cor,
  suave,
  peso,
  centro,
  tabular,
  style,
  ...props
}: PropsTexto) {
  const { cores, fonte } = useTema();
  const base = tipografia[variante];
  const pesoFinal = peso ?? (base.peso as '400' | '500' | '600' | '700');
  const estilo: TextStyle = {
    fontSize: base.fontSize,
    lineHeight: base.lineHeight,
    letterSpacing: base.letterSpacing,
    color: cor ?? (suave ? cores.textoSuave : cores.texto),
    textAlign: centro ? 'center' : undefined,
    ...fonte(pesoFinal),
    ...(tabular ? { fontVariant: ['tabular-nums'] as TextStyle['fontVariant'] } : null),
  };
  return <TextoRN {...props} style={[estilo, style]} />;
}
