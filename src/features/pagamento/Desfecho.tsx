import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { formatarHora, formatarReais } from '@/lib/format';
import { useTema } from '@/theme';
import { SeloFarroupilha } from '@/features/comum/MarcaFarroups';
import { Divisor, Superficie, Texto, Valor } from '@/ui';

/** Quanto tempo a tela inteira fica tomada pela cor antes de se recolher. */
const PAUSA_CHEIA = 780;
const RECOLHIMENTO = 620;

function Simbolo({ tipo, cor, tamanho }: { tipo: 'aprovado' | 'recusado'; cor: string; tamanho: number }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path
        d={tipo === 'aprovado' ? 'M4.5 12.5 9.8 17.8 19.5 6.8' : 'M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5'}
        stroke={cor}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface PropsDesfecho {
  tipo: 'aprovado' | 'recusado';
  titulo: string;
  /** Loja que recebeu — ou que recusaria — o pagamento. */
  destinatario: string;
  valorCentavos: number;
  identificador?: string;
  quando?: string;
  mensagem?: string;
  itens?: { nome: string; valorCentavos: number }[];
  saldoRestanteCentavos?: number;
  acoes: React.ReactNode;
}

/**
 * Desfecho do pagamento em dois tempos: primeiro a tela inteira se pinta da
 * cor do resultado — verde ou coral — com o símbolo grande no centro; depois
 * ela se recolhe para o alto e revela o recibo, com valor, destinatário e
 * identificador. O símbolo viaja do centro para o topo, então a transição
 * lê como uma coisa só, e não como duas telas diferentes.
 */
export function Desfecho({
  tipo,
  titulo,
  destinatario,
  valorCentavos,
  identificador,
  quando,
  mensagem,
  itens,
  saldoRestanteCentavos,
  acoes,
}: PropsDesfecho) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const [altura, setAltura] = useState(0);
  const progresso = useRef(new Animated.Value(0)).current;
  const entradaSimbolo = useRef(new Animated.Value(0)).current;

  const corCheia = tipo === 'aprovado' ? cores.sucesso : cores.alerta;
  const corSuave = tipo === 'aprovado' ? cores.sucessoSuave : cores.alertaSuave;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(
        tipo === 'aprovado'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
    }
    Animated.sequence([
      Animated.spring(entradaSimbolo, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 70,
      }),
      Animated.delay(PAUSA_CHEIA),
      Animated.timing(progresso, {
        toValue: 1,
        duration: RECOLHIMENTO,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [entradaSimbolo, progresso, tipo]);

  // O símbolo sai do centro da tela e pousa onde fica o emblema do recibo.
  const alvoY = 96;
  const deslocamento = altura ? alvoY - altura / 2 : -220;

  const escalaSimbolo = Animated.multiply(
    entradaSimbolo,
    progresso.interpolate({ inputRange: [0, 1], outputRange: [1, 0.34] }),
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: cores.fundo }}
      onLayout={(e) => setAltura(e.nativeEvent.layout.height)}
    >
      {/* Fase 1: a cor toma a tela inteira e depois some. */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: corCheia,
          opacity: progresso.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
          zIndex: 3,
        }}
      >
        <View style={{ position: 'absolute', top: 26, right: 20 }}>
          <SeloFarroupilha tamanho={30} cor="#FFFFFF" opacidade={0.55} />
        </View>
      </Animated.View>

      {/* O símbolo atravessa as duas fases: é o fio que costura a transição. */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4,
          transform: [
            { translateY: progresso.interpolate({ inputRange: [0, 1], outputRange: [0, deslocamento] }) },
            { scale: escalaSimbolo },
          ],
        }}
      >
        <View
          style={{
            width: 168,
            height: 168,
            borderRadius: 84,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* O disco troca de pele por opacidade: cor sobre cor não pode ser
              animada pelo driver nativo. */}
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 84,
              backgroundColor: 'rgba(255,255,255,0.18)',
              opacity: progresso.interpolate({ inputRange: [0, 0.7], outputRange: [1, 0] }),
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 84,
              backgroundColor: corSuave,
              opacity: progresso,
            }}
          />
          <Animated.View
            style={{
              opacity: progresso.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] }),
              position: 'absolute',
            }}
          >
            <Simbolo tipo={tipo} cor="#FFFFFF" tamanho={92} />
          </Animated.View>
          <Animated.View style={{ opacity: progresso }}>
            <Simbolo tipo={tipo} cor={corCheia} tamanho={92} />
          </Animated.View>
        </View>
      </Animated.View>

      {/* Fase 1: o texto que acompanha a cor cheia. */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          top: 0,
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 96,
          zIndex: 4,
          opacity: progresso.interpolate({ inputRange: [0, 0.45], outputRange: [1, 0] }),
        }}
      >
        <Texto variante="titulo" cor="#FFFFFF" centro>
          {titulo}
        </Texto>
        <Texto variante="corpo" cor="rgba(255,255,255,0.85)" centro>
          {destinatario}
        </Texto>
      </Animated.View>

      {/* Fase 2: o recibo. */}
      <Animated.View
        style={{
          flex: 1,
          paddingTop: insets.top,
          opacity: progresso.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 0, 1] }),
          transform: [
            { translateY: progresso.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
          ],
        }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 24 + insets.bottom,
            width: '100%',
            maxWidth: 460,
            alignSelf: 'center',
          }}
          showsVerticalScrollIndicator={false}
        >
        <View style={{ alignItems: 'center', paddingTop: 178, gap: 6 }}>
          <Texto variante="titulo" centro>
            {titulo}
          </Texto>
          <Texto variante="legenda" suave centro>
            {destinatario}
            {quando ? ` · ${formatarHora(quando)}` : ''}
          </Texto>
          <View style={{ paddingTop: 10 }}>
            <Valor
              centavos={valorCentavos}
              tamanho={40}
              sinal={tipo === 'aprovado' ? '-' : undefined}
              cor={tipo === 'recusado' ? cores.textoSuave : undefined}
            />
          </View>
          {mensagem && (
            <Texto variante="corpo" centro style={{ maxWidth: 290, paddingTop: 6 }}>
              {mensagem}
            </Texto>
          )}
        </View>

        <View style={{ paddingTop: 20, gap: 14 }}>
          <Superficie preenchimento={16}>
            <View style={{ gap: 10 }}>
              {(itens ?? []).map((i, idx) => (
                <View key={idx} style={{ flexDirection: 'row' }}>
                  <Texto variante="corpo" style={{ flex: 1 }}>
                    {i.nome}
                  </Texto>
                  <Texto variante="corpo" tabular suave>
                    {formatarReais(i.valorCentavos)}
                  </Texto>
                </View>
              ))}
              {(itens ?? []).length > 0 && <Divisor />}
              <Linha rotulo="Destinatário" valor={destinatario} />
              {saldoRestanteCentavos != null && (
                <Linha rotulo="Saldo restante" valor={formatarReais(saldoRestanteCentavos)} destaque />
              )}
              {identificador && <Linha rotulo="Identificador" valor={identificador} pequeno />}
            </View>
          </Superficie>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <SeloFarroupilha tamanho={18} cor={cores.textoSuave} opacidade={0.7} />
            <Texto variante="legenda" suave>
              {tipo === 'aprovado'
                ? 'Recibo enviado ao responsável'
                : 'Nada foi debitado da conta'}
            </Texto>
          </View>
          {acoes}
        </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function Linha({
  rotulo,
  valor,
  destaque,
  pequeno,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
  pequeno?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Texto variante="legenda" suave style={{ flex: 1 }}>
        {rotulo}
      </Texto>
      <Texto
        variante={destaque ? 'corpoForte' : pequeno ? 'legenda' : 'corpo'}
        suave={pequeno}
        tabular={destaque}
        style={{ flexShrink: 1, textAlign: 'right' }}
      >
        {valor}
      </Texto>
    </View>
  );
}
