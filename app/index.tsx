import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSessao } from '@/state/sessao';
import { useTema } from '@/theme';
import { Texto } from '@/ui';
import { MarcaFarroups } from '@/features/comum/MarcaFarroups';

export default function Porta() {
  const { sessao, carregando, usuario } = useSessao();

  if (carregando) return <Splash />;
  if (!sessao || !usuario) return <Redirect href="/(auth)/login" />;

  if ((usuario.perfil === 'aluno' || usuario.perfil === 'responsavel') && !usuario.temPin) {
    return <Redirect href="/(auth)/pin" />;
  }

  switch (usuario.perfil) {
    case 'aluno':
      return <Redirect href="/(aluno)" />;
    case 'responsavel':
      return <Redirect href="/(responsavel)" />;
    case 'lojista':
      return <Redirect href="/(lojista)" />;
    case 'admin':
      return <Redirect href="/admin" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }
}

/** Splash com a marca: aparece por instantes enquanto a sessão é restaurada. */
export function Splash() {
  const { cores } = useTema();
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: cores.fundo,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
      }}
    >
      <Animated.View
        style={{
          opacity: entrada,
          transform: [
            { scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
          ],
          alignItems: 'center',
          gap: 14,
        }}
      >
        <MarcaFarroups tamanho={64} />
        <Texto variante="titulo">Farroups-pay</Texto>
        <Texto variante="legenda" suave>
          Colégio Farroupilha
        </Texto>
      </Animated.View>
    </View>
  );
}
