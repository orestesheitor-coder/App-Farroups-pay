import React from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTema } from '@/theme';
import { AssinaturaCanto } from '@/features/comum/MarcaFarroups';
import { BotaoIcone } from './Botao';
import { Texto } from './Texto';

/**
 * Fundo lúdico das contas dos anos iniciais: nuvens, folhinhas e bolhas em
 * traço leve, atrás do conteúdo e fora do alcance do toque.
 */
export function FundoInfantil() {
  const { cores } = useTema();
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 390 800" preserveAspectRatio="xMidYMid slice">
        <Circle cx="330" cy="90" r="58" fill={cores.ilustracao} />
        <Circle cx="52" cy="250" r="34" fill={cores.ilustracao} />
        <Circle cx="352" cy="470" r="26" fill={cores.ilustracao} />
        {/* nuvem */}
        <Path
          d="M60 118c0-13 11-24 24-24 4-13 16-22 30-22 17 0 31 12 34 28 12 2 21 12 21 24 0 13-11 24-25 24H84c-13 0-24-11-24-24z"
          fill={cores.ilustracao}
        />
        {/* folhinhas, ecoando a marca do colégio */}
        <Path d="M28 620c30-34 72-52 96-52-22 26-58 45-96 52z" fill={cores.ilustracao} />
        <Path d="M300 690c26-28 62-44 82-44-19 22-50 38-82 44z" fill={cores.ilustracao} />
        {/* estrelinhas */}
        <Path d="M262 168l7 16 17 2-13 12 4 17-15-9-15 9 4-17-13-12 17-2z" fill={cores.ilustracao} />
        <Path d="M96 452l6 13 14 2-10 10 3 14-13-7-12 7 3-14-11-10 14-2z" fill={cores.ilustracao} />
      </Svg>
    </View>
  );
}

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
  const { cores, segmento } = useTema();
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
      {segmento === 'infantil' && <FundoInfantil />}
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
      <AssinaturaCanto />
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
