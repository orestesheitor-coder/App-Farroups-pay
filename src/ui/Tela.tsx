import React from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTema } from '@/theme';
import { BotaoIcone } from './Botao';
import { Texto } from './Texto';

/** Largura útil travada para o app respirar igual de 360px a 430px. */
export const LARGURA_MAXIMA = 460;

export function Tela({
  children,
  rolagem = true,
  preenchimento = 20,
  estilo,
  aoFinal,
}: {
  children: React.ReactNode;
  rolagem?: boolean;
  preenchimento?: number;
  estilo?: ViewStyle;
  aoFinal?: React.ReactNode;
}) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();

  const conteudo = (
    <View
      style={{
        width: '100%',
        maxWidth: LARGURA_MAXIMA,
        alignSelf: 'center',
        paddingHorizontal: preenchimento,
        ...estilo,
      }}
    >
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      {rolagem ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {conteudo}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{conteudo}</View>
      )}
      {aoFinal && (
        <View
          style={{
            paddingHorizontal: preenchimento,
            paddingTop: 12,
            paddingBottom: 12 + insets.bottom,
            backgroundColor: cores.fundo,
            borderTopWidth: 1,
            borderTopColor: cores.borda,
          }}
        >
          <View style={{ width: '100%', maxWidth: LARGURA_MAXIMA, alignSelf: 'center' }}>
            {aoFinal}
          </View>
        </View>
      )}
    </View>
  );
}

export function Cabecalho({
  titulo,
  subtitulo,
  voltar = true,
  acao,
}: {
  titulo: string;
  subtitulo?: string;
  voltar?: boolean;
  acao?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <View style={{ paddingTop: 8, paddingBottom: 16, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44 }}>
        {voltar && (
          <View style={{ marginLeft: -12 }}>
            <BotaoIcone
              nome="setaEsquerda"
              rotulo="Voltar"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />
          </View>
        )}
        <View style={{ flex: 1 }} />
        {acao}
      </View>
      <Texto variante="display">{titulo}</Texto>
      {subtitulo && (
        <Texto variante="legenda" suave>
          {subtitulo}
        </Texto>
      )}
    </View>
  );
}
