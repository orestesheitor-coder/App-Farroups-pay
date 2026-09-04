import React, { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { useAsync } from '@/lib/hooks';
import { formatarDataHora, formatarReais, parseCentavos } from '@/lib/format';
import { raio, useTema } from '@/theme';
import type { ModoNotificacao } from '@/domain/types';
import {
  Cabecalho,
  Campo,
  EstadoErro,
  EstadoVazio,
  EsqueletoLista,
  LinhaLista,
  Superficie,
  Tela,
  Texto,
  useAlerta,
} from '@/ui';

const MODOS: { valor: ModoNotificacao; rotulo: string; descricao: string }[] = [
  { valor: 'toda_compra', rotulo: 'Toda compra', descricao: 'Aviso a cada transação aprovada' },
  { valor: 'acima_de', rotulo: 'Só acima de um valor', descricao: 'Compras pequenas não geram push' },
  { valor: 'resumo_diario', rotulo: 'Resumo diário', descricao: 'Um aviso no fim do dia' },
  { valor: 'nenhuma', rotulo: 'Nenhuma', descricao: 'Sem notificações de compra' },
];

export default function Notificacoes() {
  const { usuario, salvarNotificacoes } = useSessao();
  const { cores } = useTema();
  const { avisar } = useAlerta();
  const [limite, setLimite] = useState('');

  const lista = useAsync(
    async () => (usuario ? api.notificacoes.listar(usuario.id) : []),
    [usuario?.id],
  );

  useEffect(() => {
    if (usuario) setLimite(String(usuario.notificacoes.acimaDeCentavos / 100).replace('.', ','));
    if (usuario) void api.notificacoes.marcarComoLidas(usuario.id);
  }, [usuario?.id]);

  if (!usuario) return null;
  const prefs = usuario.notificacoes;

  async function definirModo(modo: ModoNotificacao) {
    await salvarNotificacoes({ ...prefs, modo });
    avisar('Preferência salva.', 'sucesso');
  }

  return (
    <Tela>
      <Cabecalho titulo="Notificações" subtitulo="O que o app avisa e quando." />

      <View style={{ gap: 16 }}>
        <Superficie preenchimento={16}>
          <Texto variante="legenda" peso="600" suave style={{ marginBottom: 4 }}>
            QUANDO AVISAR
          </Texto>
          {MODOS.map((m, i) => (
            <LinhaLista
              key={m.valor}
              primeira={i === 0}
              titulo={m.rotulo}
              descricao={m.descricao}
              onPress={() => void definirModo(m.valor)}
              direita={
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: prefs.modo === m.valor ? cores.marca : cores.borda,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {prefs.modo === m.valor && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: cores.marca,
                      }}
                    />
                  )}
                </View>
              }
            />
          ))}

          {prefs.modo === 'acima_de' && (
            <View style={{ paddingTop: 14 }}>
              <Campo
                rotulo="Avisar em compras acima de"
                keyboardType="number-pad"
                value={limite}
                onChangeText={setLimite}
                auxiliar={`Hoje: ${formatarReais(prefs.acimaDeCentavos)}`}
                onEndEditing={async () => {
                  await salvarNotificacoes({
                    ...prefs,
                    acimaDeCentavos: parseCentavos(limite) * (limite.includes(',') ? 1 : 100),
                  });
                  avisar('Valor salvo.', 'sucesso');
                }}
              />
            </View>
          )}

          <View style={{ paddingTop: 6 }}>
            <LinhaLista
              titulo="Avisar recargas"
              descricao="Push quando o saldo é adicionado"
              direita={
                <Switch
                  value={prefs.recargas}
                  onValueChange={(v) => void salvarNotificacoes({ ...prefs, recargas: v })}
                  trackColor={{ true: cores.marca, false: cores.superficieToque }}
                  accessibilityLabel="Avisar recargas"
                />
              }
            />
          </View>
        </Superficie>

        <Superficie preenchimento={16}>
          <Texto variante="legenda" peso="600" suave style={{ marginBottom: 8 }}>
            RECEBIDAS
          </Texto>
          {lista.erro ? (
            <EstadoErro mensagem={lista.erro} aoTentarNovamente={lista.recarregar} />
          ) : lista.carregando ? (
            <EsqueletoLista linhas={3} />
          ) : (lista.dados ?? []).length === 0 ? (
            <EstadoVazio
              icone="sino"
              titulo="Sem notificações"
              descricao="Compras e recargas aparecem aqui assim que acontecerem."
            />
          ) : (
            (lista.dados ?? []).map((n, i) => (
              <View
                key={n.id}
                style={{
                  paddingVertical: 12,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: cores.borda,
                  gap: 3,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Texto variante="corpoForte" style={{ flex: 1 }}>
                    {n.titulo}
                  </Texto>
                  {!n.lida && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: raio.pill,
                        backgroundColor: cores.marca,
                      }}
                    />
                  )}
                </View>
                <Texto variante="legenda">{n.corpo}</Texto>
                <Texto variante="legenda" suave>
                  {formatarDataHora(n.criadaEm)}
                </Texto>
              </View>
            ))
          )}
        </Superficie>
      </View>
      <View style={{ height: 24 }} />
    </Tela>
  );
}
