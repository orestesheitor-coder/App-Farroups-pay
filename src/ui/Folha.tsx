import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { duracao, raio, useTema } from '@/theme';
import { BotaoIcone } from './Botao';
import { Texto } from './Texto';
import { LARGURA_MAXIMA } from './Tela';

/** Folha inferior — entra em 240ms com easing suave, sem exagero. */
export function Folha({
  visivel,
  aoFechar,
  titulo,
  subtitulo,
  children,
}: {
  visivel: boolean;
  aoFechar: () => void;
  titulo?: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const deslocamento = useRef(new Animated.Value(60)).current;
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visivel) {
      Animated.parallel([
        Animated.timing(deslocamento, {
          toValue: 0,
          duration: duracao.media,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacidade, {
          toValue: 1,
          duration: duracao.media,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      deslocamento.setValue(60);
      opacidade.setValue(0);
    }
  }, [visivel, deslocamento, opacidade]);

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoFechar}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <Pressable
          accessibilityLabel="Fechar"
          style={{ flex: 1 }}
          onPress={aoFechar}
        />
        <Animated.View
          style={{
            transform: [{ translateY: deslocamento }],
            opacity: opacidade,
            backgroundColor: cores.fundo,
            borderTopLeftRadius: raio.xl,
            borderTopRightRadius: raio.xl,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 20 + insets.bottom,
            width: '100%',
            maxWidth: LARGURA_MAXIMA,
            alignSelf: 'center',
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: cores.borda,
              alignSelf: 'center',
              marginBottom: 12,
            }}
          />
          {titulo && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Texto variante="titulo">{titulo}</Texto>
                {subtitulo && (
                  <Texto variante="legenda" suave>
                    {subtitulo}
                  </Texto>
                )}
              </View>
              <View style={{ marginRight: -10, marginTop: -8 }}>
                <BotaoIcone nome="x" rotulo="Fechar" onPress={aoFechar} cor={cores.textoSuave} />
              </View>
            </View>
          )}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
