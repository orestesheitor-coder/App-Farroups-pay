import React from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { useTema } from '@/theme';

/**
 * A marca do Colégio Farroupilha em versão minimalista: o arco aberto e as
 * folhas que dele partem. Desenhada em traço cheio para continuar legível a
 * 16px, que é o tamanho que ela ocupa nos cantos das telas.
 */
function Folhas({ cor, ondas = false }: { cor: string; ondas?: boolean }) {
  return (
    <G>
      {/* Ecos do arco: a marca do colégio também lê como onda de aproximação. */}
      {ondas && (
        <>
          <Path
            d="M50.5 8.5A29.5 29.5 0 1 0 50.5 55.5"
            stroke={cor}
            strokeWidth={3.4}
            strokeLinecap="round"
            fill="none"
            opacity={0.42}
          />
          <Path
            d="M56 1.5A37 37 0 1 0 56 62.5"
            stroke={cor}
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
            opacity={0.2}
          />
        </>
      )}
      {/* Arco aberto à direita */}
      <Path
        d="M45 15.5A21.5 21.5 0 1 0 45 48.5"
        stroke={cor}
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
      />
      {/* Folha superior, a mais longa */}
      <Path
        d="M11 45C27 25 49 15.5 61.5 15.5 47.5 30 29.5 41 11 45Z"
        fill={cor}
      />
      {/* Folha inferior, mais curta, cria a profundidade do conjunto */}
      <Path
        d="M17 50.5C29.5 39 45 33 56.5 33 45 43 30.5 49.5 17 50.5Z"
        fill={cor}
      />
    </G>
  );
}

/** Marca completa: as folhas brancas sobre o azul institucional. */
export function MarcaFarroups({ tamanho = 40 }: { tamanho?: number }) {
  const { cores } = useTema();
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 64 64">
      <Rect x="0" y="0" width="64" height="64" rx="18" fill={cores.marca} />
      <G scale={0.66} translateX={11} translateY={11}>
        <Folhas cor="#FFFFFF" ondas />
      </G>
    </Svg>
  );
}

/** Só o símbolo, na cor que a tela pedir — para o cartão e os cantos. */
export function SeloFarroupilha({
  tamanho = 28,
  cor,
  opacidade = 1,
  ondas = false,
}: {
  tamanho?: number;
  cor?: string;
  opacidade?: number;
  /** Os arcos-eco só cabem em tamanhos grandes; no canto viram ruído. */
  ondas?: boolean;
}) {
  const { cores } = useTema();
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 64 64" opacity={opacidade}>
      {ondas ? (
        <G scale={0.84} translateX={5} translateY={5}>
          <Folhas cor={cor ?? cores.marca} ondas />
        </G>
      ) : (
        <Folhas cor={cor ?? cores.marca} />
      )}
    </Svg>
  );
}

/**
 * Assinatura discreta no canto da tela: reafirma que a carteira é do colégio
 * sem competir com o conteúdo. Não recebe toque.
 */
export function AssinaturaCanto({
  posicao = 'superior-direito',
}: {
  posicao?: 'superior-direito' | 'inferior-direito';
}) {
  const { cores, escura } = useTema();
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        right: 14,
        ...(posicao === 'superior-direito' ? { top: 10 } : { bottom: 10 }),
        zIndex: 2,
      }}
    >
      <SeloFarroupilha tamanho={26} cor={cores.marca} opacidade={escura ? 0.24 : 0.16} />
    </View>
  );
}
