import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { duracao, raio, sombraCartao, useTema } from '@/theme';
import { Icone } from './Icones';
import { Texto } from './Texto';
import { LARGURA_MAXIMA } from './Tela';

type Tom = 'sucesso' | 'erro' | 'neutro';
interface Aviso {
  id: number;
  mensagem: string;
  tom: Tom;
}

const Contexto = createContext<{ avisar: (mensagem: string, tom?: Tom) => void }>({
  avisar: () => undefined,
});

export function ProvedorAlerta({ children }: { children: React.ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const avisar = useCallback((mensagem: string, tom: Tom = 'neutro') => {
    setAviso({ id: Date.now(), mensagem, tom });
  }, []);

  return (
    <Contexto.Provider value={{ avisar }}>
      {children}
      {aviso && <Faixa aviso={aviso} aoSumir={() => setAviso(null)} />}
    </Contexto.Provider>
  );
}

function Faixa({ aviso, aoSumir }: { aviso: Aviso; aoSumir: () => void }) {
  const { cores, escura } = useTema();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(-20)).current;
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, {
        toValue: 0,
        duration: duracao.media,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacidade, { toValue: 1, duration: duracao.media, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.timing(opacidade, {
        toValue: 0,
        duration: duracao.media,
        useNativeDriver: true,
      }).start(aoSumir);
    }, 3200);
    return () => clearTimeout(t);
  }, [aviso.id, y, opacidade, aoSumir]);

  const cor =
    aviso.tom === 'sucesso' ? cores.sucesso : aviso.tom === 'erro' ? cores.alerta : cores.texto;

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        transform: [{ translateY: y }],
        opacity: opacidade,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          maxWidth: LARGURA_MAXIMA - 32,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: raio.md,
          backgroundColor: cores.superficie,
          borderWidth: 1,
          borderColor: cores.borda,
          ...sombraCartao(cores.sombra, escura),
        }}
      >
        <Icone
          nome={aviso.tom === 'erro' ? 'alerta' : aviso.tom === 'sucesso' ? 'checkCirculo' : 'sino'}
          tamanho={18}
          cor={cor}
        />
        <Texto variante="legenda" peso="600" style={{ flex: 1 }}>
          {aviso.mensagem}
        </Texto>
      </View>
    </Animated.View>
  );
}

export function useAlerta() {
  return useContext(Contexto);
}
