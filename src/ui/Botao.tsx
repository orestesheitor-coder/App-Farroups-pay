import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { duracao, raio, useTema } from '@/theme';
import { Texto } from './Texto';
import { Icone, type NomeIcone } from './Icones';

type Tipo = 'primario' | 'secundario' | 'fantasma' | 'perigo';

export interface PropsBotao extends Omit<PressableProps, 'style'> {
  titulo: string;
  tipo?: Tipo;
  icone?: NomeIcone;
  carregando?: boolean;
  largura?: 'total' | 'auto';
  compacto?: boolean;
  estilo?: ViewStyle;
}

/** Micro-feedback físico: leve compressão ao toque + haptic no aparelho. */
export function Botao({
  titulo,
  tipo = 'primario',
  icone,
  carregando,
  largura = 'total',
  compacto,
  disabled,
  estilo,
  onPress,
  ...props
}: PropsBotao) {
  const { cores, escura } = useTema();
  const escala = useRef(new Animated.Value(1)).current;
  const inativo = disabled || carregando;

  const paleta: Record<Tipo, { fundo: string; texto: string; borda?: string }> = {
    primario: { fundo: cores.marcaBotao, texto: '#FFFFFF' },
    secundario: {
      fundo: escura ? cores.superficieAlt : cores.superficieAlt,
      texto: cores.texto,
    },
    fantasma: { fundo: 'transparent', texto: cores.texto, borda: cores.borda },
    perigo: { fundo: cores.alertaSuave, texto: cores.alerta },
  };
  const p = paleta[tipo];

  return (
    <Animated.View
      style={{
        transform: [{ scale: escala }],
        alignSelf: largura === 'total' ? 'stretch' : 'flex-start',
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={titulo}
        accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
        disabled={inativo}
        onPressIn={() =>
          Animated.timing(escala, {
            toValue: 0.97,
            duration: duracao.rapida,
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 20 }).start()
        }
        onPress={(e) => {
          if (Platform.OS !== 'web') {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress?.(e);
        }}
        style={{
          minHeight: compacto ? 44 : 54,
          paddingHorizontal: compacto ? 13 : 22,
          borderRadius: raio.md,
          backgroundColor: p.fundo,
          borderWidth: p.borda ? 1 : 0,
          borderColor: p.borda,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          opacity: inativo ? 0.55 : 1,
          ...estilo,
        }}
        {...props}
      >
        {carregando ? (
          <ActivityIndicator color={p.texto} />
        ) : (
          <>
            {icone && <Icone nome={icone} tamanho={19} cor={p.texto} />}
            <Texto
              variante={compacto ? 'corpoForte' : 'subtitulo'}
              cor={p.texto}
              numberOfLines={1}
              style={compacto ? { fontSize: 14 } : undefined}
            >
              {titulo}
            </Texto>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

/** Botão de ícone com área de toque mínima de 44px. */
export function BotaoIcone({
  nome,
  rotulo,
  onPress,
  cor,
  fundo,
}: {
  nome: NomeIcone;
  rotulo: string;
  onPress?: () => void;
  cor?: string;
  fundo?: string;
}) {
  const { cores } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: raio.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: fundo ?? 'transparent',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icone nome={nome} cor={cor ?? cores.texto} />
    </Pressable>
  );
}

export function Pilula({
  titulo,
  ativa,
  onPress,
}: {
  titulo: string;
  ativa: boolean;
  onPress: () => void;
}) {
  const { cores } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: ativa }}
      accessibilityLabel={titulo}
      onPress={onPress}
      style={{
        minHeight: 38,
        paddingHorizontal: 14,
        justifyContent: 'center',
        borderRadius: raio.pill,
        backgroundColor: ativa ? cores.texto : cores.superficieAlt,
      }}
    >
      <Texto variante="legenda" peso="600" cor={ativa ? cores.textoInverso : cores.textoSuave}>
        {titulo}
      </Texto>
    </Pressable>
  );
}

export function Toque({
  children,
  onPress,
  rotulo,
  estilo,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  rotulo?: string;
  estilo?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={rotulo}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed && onPress ? 0.65 : 1, ...estilo })}
    >
      <View>{children}</View>
    </Pressable>
  );
}
