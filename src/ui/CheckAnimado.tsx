import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/** Traço do check desenhado em 320ms — o único momento de celebração do app. */
export function CheckAnimado({ cor, fundo }: { cor: string; fundo: string }) {
  const escala = useRef(new Animated.Value(0.7)).current;
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(escala, { toValue: 1, useNativeDriver: true, friction: 5, tension: 90 }),
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [escala, opacidade]);

  return (
    <Animated.View
      style={{
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: fundo,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: escala }],
        opacity: opacidade,
      }}
    >
      <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4.5 12.5 9.8 17.8 19.5 6.8"
          stroke={cor}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}
