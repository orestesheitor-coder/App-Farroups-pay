import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { raio, useTema } from '@/theme';
import { Icone } from './Icones';
import { Texto } from './Texto';

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'apagar'];

/** Teclado numérico usado na cobrança do lojista e no PIN. */
export function TecladoNumerico({
  aoDigitar,
  aoApagar,
  mostrarVirgula = true,
  compacto,
}: {
  aoDigitar: (d: string) => void;
  aoApagar: () => void;
  mostrarVirgula?: boolean;
  compacto?: boolean;
}) {
  const { cores } = useTema();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {TECLAS.map((tecla) => {
        const vazia = tecla === ',' && !mostrarVirgula;
        return (
          <Pressable
            key={tecla}
            disabled={vazia}
            accessibilityRole="button"
            accessibilityLabel={tecla === 'apagar' ? 'Apagar' : tecla}
            onPress={() => {
              if (Platform.OS !== 'web') {
                void Haptics.selectionAsync();
              }
              if (tecla === 'apagar') aoApagar();
              else aoDigitar(tecla);
            }}
            style={({ pressed }) => ({
              width: '33.33%',
              height: compacto ? 58 : 68,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: raio.md,
              backgroundColor: pressed ? cores.superficieToque : 'transparent',
            })}
          >
            {tecla === 'apagar' ? (
              <Icone nome="setaEsquerda" tamanho={22} cor={cores.textoSuave} />
            ) : vazia ? null : (
              <Texto variante="titulo" tabular>
                {tecla}
              </Texto>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export function PontosPin({
  tamanho,
  preenchidos,
  erro,
}: {
  tamanho: number;
  preenchidos: number;
  erro?: boolean;
}) {
  const { cores } = useTema();
  return (
    <View
      accessible
      accessibilityLabel={`${preenchidos} de ${tamanho} dígitos informados`}
      style={{ flexDirection: 'row', gap: 14, justifyContent: 'center' }}
    >
      {Array.from({ length: tamanho }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            borderWidth: 1.5,
            borderColor: erro ? cores.alerta : i < preenchidos ? cores.texto : cores.borda,
            backgroundColor: i < preenchidos ? (erro ? cores.alerta : cores.texto) : 'transparent',
          }}
        />
      ))}
    </View>
  );
}
