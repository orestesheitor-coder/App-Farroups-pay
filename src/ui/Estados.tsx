import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { raio, useTema } from '@/theme';
import { Botao } from './Botao';
import { Icone, type NomeIcone } from './Icones';
import { Texto } from './Texto';

/** Placeholder pulsante — nenhuma tela do app mostra branco enquanto carrega. */
export function Esqueleto({
  altura = 16,
  largura = '100%',
  arredondamento = raio.sm,
  estilo,
}: {
  altura?: number;
  largura?: number | `${number}%`;
  arredondamento?: number;
  estilo?: object;
}) {
  const { cores } = useTema();
  const brilho = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(brilho, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(brilho, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    animacao.start();
    return () => animacao.stop();
  }, [brilho]);

  return (
    <Animated.View
      accessibilityLabel="Carregando"
      style={[
        {
          height: altura,
          width: largura,
          borderRadius: arredondamento,
          backgroundColor: cores.esqueleto,
          opacity: brilho,
        },
        estilo,
      ]}
    />
  );
}

export function EsqueletoLista({ linhas = 4 }: { linhas?: number }) {
  return (
    <View style={{ gap: 14 }}>
      {Array.from({ length: linhas }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Esqueleto altura={44} largura={44} arredondamento={raio.md} />
          <View style={{ flex: 1, gap: 8 }}>
            <Esqueleto altura={13} largura="60%" />
            <Esqueleto altura={11} largura="35%" />
          </View>
          <Esqueleto altura={16} largura={64} />
        </View>
      ))}
    </View>
  );
}

export function EstadoVazio({
  icone = 'recibo',
  titulo,
  descricao,
  acao,
}: {
  icone?: NomeIcone;
  titulo: string;
  descricao?: string;
  acao?: { titulo: string; onPress: () => void };
}) {
  const { cores } = useTema();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: raio.pill,
          backgroundColor: cores.superficieAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icone nome={icone} tamanho={26} cor={cores.textoSuave} />
      </View>
      <Texto variante="subtitulo" centro>
        {titulo}
      </Texto>
      {descricao && (
        <Texto variante="legenda" suave centro style={{ maxWidth: 260 }}>
          {descricao}
        </Texto>
      )}
      {acao && (
        <View style={{ marginTop: 8 }}>
          <Botao titulo={acao.titulo} tipo="secundario" largura="auto" compacto onPress={acao.onPress} />
        </View>
      )}
    </View>
  );
}

export function EstadoErro({
  mensagem,
  aoTentarNovamente,
}: {
  mensagem: string;
  aoTentarNovamente?: () => void;
}) {
  const { cores } = useTema();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36, gap: 10 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: raio.pill,
          backgroundColor: cores.alertaSuave,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icone nome="alerta" tamanho={26} cor={cores.alerta} />
      </View>
      <Texto variante="subtitulo" centro>
        Não foi possível carregar
      </Texto>
      <Texto variante="legenda" suave centro style={{ maxWidth: 280 }}>
        {mensagem}
      </Texto>
      {aoTentarNovamente && (
        <View style={{ marginTop: 8 }}>
          <Botao
            titulo="Tentar de novo"
            tipo="secundario"
            icone="atualizar"
            largura="auto"
            compacto
            onPress={aoTentarNovamente}
          />
        </View>
      )}
    </View>
  );
}
