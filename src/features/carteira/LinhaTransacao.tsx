import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Transacao } from '@/domain/types';
import { formatarHora, formatarReais } from '@/lib/format';
import { useTema } from '@/theme';
import { MarcaLoja, Texto } from '@/ui';

export function LinhaTransacao({
  transacao,
  mostrarData,
  aoTocar,
}: {
  transacao: Transacao;
  mostrarData?: string;
  aoTocar?: () => void;
}) {
  const { cores } = useTema();
  const router = useRouter();
  const credito = transacao.tipo === 'credito' || transacao.tipo === 'estorno';
  const recusada = transacao.status === 'recusada';
  const estornada = transacao.status === 'estornada';

  const cor = recusada
    ? cores.textoSuave
    : credito
      ? cores.sucesso
      : cores.texto;

  const legenda = recusada
    ? transacao.mensagemRecusa ?? 'Recusada'
    : estornada
      ? `Estornada · ${formatarHora(transacao.criadaEm)}`
      : `${mostrarData ? `${mostrarData} · ` : ''}${formatarHora(transacao.criadaEm)}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${transacao.descricao}, ${credito ? 'crédito' : 'débito'} de ${formatarReais(
        transacao.valorCentavos,
      )}, ${legenda}`}
      onPress={aoTocar ?? (() => router.push(`/transacao/${transacao.id}`))}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <MarcaLoja
        lojaId={transacao.lojaId}
        tom={recusada ? 'alerta' : credito ? 'sucesso' : 'marca'}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <Texto variante="corpoForte" numberOfLines={1}>
          {transacao.descricao}
        </Texto>
        <Texto variante="legenda" suave numberOfLines={1}>
          {legenda}
        </Texto>
      </View>
      <Texto
        variante="corpoForte"
        tabular
        cor={cor}
        style={
          recusada || estornada ? { textDecorationLine: 'line-through' } : undefined
        }
      >
        {credito ? '+' : '−'} {formatarReais(transacao.valorCentavos)}
      </Texto>
    </Pressable>
  );
}
