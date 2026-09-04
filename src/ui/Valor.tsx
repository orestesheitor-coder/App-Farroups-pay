import React from 'react';
import { View } from 'react-native';
import { formatarValor } from '@/lib/format';
import { useTema } from '@/theme';
import { Texto } from './Texto';

/**
 * Saldo como elemento gráfico: "R$" discreto, inteiros pesados,
 * centavos menores e números tabulares.
 */
export function Valor({
  centavos,
  tamanho = 40,
  cor,
  sinal,
  oculto,
}: {
  centavos: number;
  tamanho?: number;
  cor?: string;
  sinal?: '+' | '-';
  oculto?: boolean;
}) {
  const { cores, fonte } = useTema();
  const corFinal = cor ?? cores.texto;
  const [inteiros, decimais] = formatarValor(Math.abs(centavos)).split(',');

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <Texto
        style={{
          fontSize: tamanho * 0.45,
          lineHeight: tamanho * 0.95,
          color: corFinal,
          marginRight: tamanho * 0.1,
          ...fonte('500'),
        }}
      >
        R$
      </Texto>
      <Texto
        tabular
        style={{
          fontSize: tamanho,
          lineHeight: tamanho * 1.08,
          letterSpacing: -tamanho * 0.035,
          color: corFinal,
          ...fonte('700'),
        }}
      >
        {oculto ? '•••' : `${sinal ?? ''}${inteiros}`}
      </Texto>
      {!oculto && (
        <Texto
          tabular
          style={{
            fontSize: tamanho * 0.5,
            lineHeight: tamanho * 0.9,
            color: corFinal,
            ...fonte('600'),
          }}
        >
          ,{decimais}
        </Texto>
      )}
    </View>
  );
}
