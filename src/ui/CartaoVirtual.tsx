import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { raio, sombraCartao, useTema } from '@/theme';
import type { Cartao } from '@/domain/types';
import { SeloFarroupilha } from '@/features/comum/MarcaFarroups';
import { Icone } from './Icones';
import { Texto } from './Texto';

/**
 * Cartão em 3D suave: uma inclinação lenta e contínua sugere volume sem
 * virar animação decorativa.
 */
export function CartaoVirtual({
  cartao,
  nome,
  compacto,
}: {
  cartao: Cartao;
  nome: string;
  compacto?: boolean;
}) {
  const { cores, escura } = useTema();
  const inclinacao = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(inclinacao, {
          toValue: 1,
          duration: 5200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(inclinacao, {
          toValue: 0,
          duration: 5200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [inclinacao]);

  const rotateY = inclinacao.interpolate({
    inputRange: [0, 1],
    outputRange: ['-3.5deg', '3.5deg'],
  });
  const rotateX = inclinacao.interpolate({
    inputRange: [0, 1],
    outputRange: ['1.6deg', '-1.6deg'],
  });

  const altura = compacto ? 172 : 205;

  return (
    <Animated.View
      accessible
      accessibilityLabel={`Cartão ${cartao.tipo === 'virtual' ? 'virtual' : 'físico'} de ${nome}, final ${cartao.ultimos4}${cartao.bloqueado ? ', bloqueado' : ''}`}
      style={{
        transform: [{ perspective: 900 }, { rotateY }, { rotateX }],
        borderRadius: raio.xl,
        ...sombraCartao(cores.sombra, escura),
      }}
    >
      <LinearGradient
        colors={
          cartao.bloqueado
            ? [escura ? '#2A2D34' : '#8A8E95', escura ? '#15171B' : '#5B6067']
            : [cores.cartaoTopo, cores.cartaoBase]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: altura,
          borderRadius: raio.xl,
          padding: 20,
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            width: 260,
            height: 260,
            borderRadius: 130,
            backgroundColor: 'rgba(255,255,255,0.07)',
            right: -90,
            top: -110,
          }}
        />
        <View style={{ position: 'absolute', right: -14, bottom: -18, opacity: 0.14 }}>
          <SeloFarroupilha tamanho={158} cor="#FFFFFF" ondas />
        </View>
        {/* A marca do colégio fica fixa no cartão, como num cartão emitido por banco. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <SeloFarroupilha tamanho={30} cor="#FFFFFF" />
          <View style={{ gap: 1, flex: 1 }}>
            <Texto variante="micro" cor="rgba(255,255,255,0.78)">
              FARROUPS-PAY
            </Texto>
            <Texto variante="corpoForte" cor="#FFFFFF">
              Colégio Farroupilha
            </Texto>
          </View>
          <Icone nome={cartao.bloqueado ? 'cadeado' : 'nfc'} tamanho={22} cor="rgba(255,255,255,0.9)" />
        </View>

        <View
          style={{
            width: 42,
            height: 30,
            borderRadius: 7,
            backgroundColor: 'rgba(255,255,255,0.28)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.35)',
          }}
        />

        <View style={{ gap: 8 }}>
          <Texto variante="titulo" cor="#FFFFFF" tabular style={{ letterSpacing: 3 }}>
            •••• {cartao.ultimos4}
          </Texto>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Texto variante="micro" cor="rgba(255,255,255,0.7)">
                TITULAR
              </Texto>
              <Texto variante="corpoForte" cor="#FFFFFF">
                {cartao.titular}
              </Texto>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Texto variante="micro" cor="rgba(255,255,255,0.7)">
                TURMA
              </Texto>
              <Texto variante="corpoForte" cor="#FFFFFF">
                {cartao.turma}
              </Texto>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
