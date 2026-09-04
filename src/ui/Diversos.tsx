import React from 'react';
import { Pressable, View } from 'react-native';
import { raio, useTema } from '@/theme';
import { Icone, type NomeIcone } from './Icones';
import { Texto } from './Texto';
import type { LojaId } from '@/domain/types';

export function Selo({
  texto,
  tom = 'neutro',
}: {
  texto: string;
  tom?: 'neutro' | 'sucesso' | 'alerta' | 'marca';
}) {
  const { cores } = useTema();
  const paleta = {
    neutro: { fundo: cores.superficieAlt, texto: cores.textoSuave },
    sucesso: { fundo: cores.sucessoSuave, texto: cores.sucesso },
    alerta: { fundo: cores.alertaSuave, texto: cores.alerta },
    marca: { fundo: cores.marcaSuave, texto: cores.marca },
  }[tom];
  return (
    <View
      style={{
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: raio.pill,
        backgroundColor: paleta.fundo,
        alignSelf: 'flex-start',
      }}
    >
      <Texto variante="micro" cor={paleta.texto}>
        {texto.toUpperCase()}
      </Texto>
    </View>
  );
}

const SIGLAS: Record<LojaId, string> = {
  'bar-do-ze': 'BZ',
  'la-brunita': 'LB',
  'saude-no-copo': 'SC',
};

export function MarcaLoja({
  lojaId,
  tamanho = 44,
  tom,
  icone,
}: {
  lojaId?: LojaId;
  tamanho?: number;
  tom?: 'sucesso' | 'alerta' | 'marca';
  icone?: NomeIcone;
}) {
  const { cores } = useTema();
  if (!lojaId) {
    const cor =
      tom === 'sucesso' ? cores.sucesso : tom === 'alerta' ? cores.alerta : cores.marca;
    const fundo =
      tom === 'sucesso' ? cores.sucessoSuave : tom === 'alerta' ? cores.alertaSuave : cores.marcaSuave;
    return (
      <View
        style={{
          width: tamanho,
          height: tamanho,
          borderRadius: raio.md,
          backgroundColor: fundo,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icone
          nome={icone ?? (tom === 'alerta' ? 'x' : 'entrada')}
          tamanho={tamanho * 0.45}
          cor={cor}
        />
      </View>
    );
  }
  return (
    <View
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: raio.md,
        backgroundColor: cores.superficieAlt,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Texto variante="corpoForte" style={{ fontSize: tamanho * 0.32 }}>
        {SIGLAS[lojaId]}
      </Texto>
    </View>
  );
}

export function LinhaLista({
  titulo,
  descricao,
  esquerda,
  direita,
  onPress,
  primeira,
}: {
  titulo: string;
  descricao?: string;
  esquerda?: React.ReactNode;
  direita?: React.ReactNode;
  onPress?: () => void;
  primeira?: boolean;
}) {
  const { cores } = useTema();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${titulo}${descricao ? `. ${descricao}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        paddingVertical: 10,
        borderTopWidth: primeira ? 0 : 1,
        borderTopColor: cores.borda,
        opacity: pressed && onPress ? 0.6 : 1,
      })}
    >
      {esquerda}
      <View style={{ flex: 1, gap: 2 }}>
        <Texto variante="corpoForte">{titulo}</Texto>
        {descricao && (
          <Texto variante="legenda" suave>
            {descricao}
          </Texto>
        )}
      </View>
      {direita ?? (onPress ? <Icone nome="setaDireita" tamanho={18} cor={cores.textoSuave} /> : null)}
    </Pressable>
  );
}

export function Seletor<T extends string>({
  opcoes,
  valor,
  aoMudar,
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  aoMudar: (v: T) => void;
}) {
  const { cores } = useTema();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: cores.superficieAlt,
        borderRadius: raio.pill,
        padding: 4,
        gap: 4,
      }}
    >
      {opcoes.map((o) => {
        const ativa = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativa }}
            accessibilityLabel={o.rotulo}
            onPress={() => aoMudar(o.valor)}
            style={{
              flex: 1,
              minHeight: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: raio.pill,
              backgroundColor: ativa ? cores.superficie : 'transparent',
            }}
          >
            <Texto variante="legenda" peso="600" cor={ativa ? cores.texto : cores.textoSuave}>
              {o.rotulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Divisor() {
  const { cores } = useTema();
  return <View style={{ height: 1, backgroundColor: cores.borda }} />;
}

export function Aviso({
  texto,
  tom = 'neutro',
  icone = 'escudo',
}: {
  texto: string;
  tom?: 'neutro' | 'alerta' | 'sucesso';
  icone?: NomeIcone;
}) {
  const { cores } = useTema();
  const paleta = {
    neutro: { fundo: cores.superficieAlt, texto: cores.textoSuave },
    alerta: { fundo: cores.alertaSuave, texto: cores.alerta },
    sucesso: { fundo: cores.sucessoSuave, texto: cores.sucesso },
  }[tom];
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 10,
        padding: 12,
        borderRadius: raio.md,
        backgroundColor: paleta.fundo,
        alignItems: 'flex-start',
      }}
    >
      <Icone nome={icone} tamanho={18} cor={paleta.texto} />
      <Texto variante="legenda" cor={paleta.texto} style={{ flex: 1 }}>
        {texto}
      </Texto>
    </View>
  );
}
