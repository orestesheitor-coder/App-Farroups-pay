import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Loja } from '@/domain/types';
import { lojaAberta } from '@/domain/regras';
import { raio, useTema } from '@/theme';
import { MarcaLoja, Texto } from '@/ui';

/** As três lojas da escola. Nenhum outro estabelecimento aceita o Farroups-pay. */
export function FaixaLojas({
  lojas,
  bloqueadas = [],
}: {
  lojas: Loja[];
  bloqueadas?: string[];
}) {
  const { cores } = useTema();
  const router = useRouter();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingRight: 20 }}
    >
      {lojas.map((loja) => {
        const aberta = lojaAberta(loja);
        const bloqueada = bloqueadas.includes(loja.id);
        return (
          <Pressable
            key={loja.id}
            accessibilityRole="button"
            accessibilityLabel={`${loja.nome}, ${bloqueada ? 'bloqueada pelo responsável' : aberta ? 'aberta' : 'fechada'}`}
            onPress={() => router.push(`/pagar/${loja.id}`)}
            style={({ pressed }) => ({
              width: 152,
              padding: 14,
              gap: 10,
              borderRadius: raio.lg,
              backgroundColor: cores.superficie,
              borderWidth: 1,
              borderColor: cores.borda,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <MarcaLoja lojaId={loja.id} tamanho={38} />
            <View style={{ gap: 3 }}>
              <Texto variante="corpoForte" numberOfLines={1}>
                {loja.nome}
              </Texto>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: bloqueada
                      ? cores.alerta
                      : aberta
                        ? cores.sucesso
                        : cores.textoSuave,
                  }}
                />
                <Texto variante="legenda" suave>
                  {bloqueada ? 'Bloqueada' : aberta ? 'Aberta agora' : `Abre ${loja.abre}`}
                </Texto>
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
