import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { api, type FiltrosExtrato } from '@/services';
import { useSessao } from '@/state/sessao';
import { useAsync } from '@/lib/hooks';
import type { LojaId, Transacao } from '@/domain/types';
import { LOJAS } from '@/services/mock/seed';
import { diaSP, formatarReais, nomeDoMes, rotuloDoDia, variacao } from '@/lib/format';
import { raio, useTema } from '@/theme';
import {
  Botao,
  Campo,
  EstadoErro,
  EstadoVazio,
  Esqueleto,
  EsqueletoLista,
  Folha,
  Pilula,
  Superficie,
  Tela,
  Texto,
  useAlerta,
} from '@/ui';
import { LinhaTransacao } from '@/features/carteira/LinhaTransacao';

export default function Extrato() {
  const { usuario, alunoAtivoId, versao } = useSessao();
  const { cores } = useTema();
  const { avisar } = useAlerta();
  const insets = useSafeAreaInsets();

  const [busca, setBusca] = useState('');
  const [loja, setLoja] = useState<LojaId | 'todas'>('todas');
  const [tipo, setTipo] = useState<'todos' | 'debito' | 'credito'>('todos');
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d' | 'tudo'>('30d');
  const [exportando, setExportando] = useState(false);
  const [folhaExportar, setFolhaExportar] = useState(false);

  const alunoId = alunoAtivoId ?? usuario?.alunoId ?? '';
  const carteira = useAsync(() => api.carteira.resumo(alunoId), [alunoId, versao]);
  const contaId = carteira.dados?.conta.id;

  const filtros: FiltrosExtrato = { lojaId: loja, tipo, periodo, busca };
  const lista = useAsync(
    async () => (contaId ? api.carteira.transacoes(contaId, filtros) : []),
    [contaId, loja, tipo, periodo, busca, versao],
  );
  const mensal = useAsync(
    async () => (contaId ? api.carteira.resumoMensal(contaId) : null),
    [contaId, versao],
  );

  const grupos = useMemo(() => agruparPorDia(lista.dados ?? []), [lista.dados]);

  async function exportar(formato: 'csv' | 'pdf') {
    if (!contaId) return;
    setExportando(true);
    try {
      if (formato === 'csv') {
        const csv = await api.carteira.exportarCsv(contaId, filtros);
        await Clipboard.setStringAsync(csv);
        avisar('CSV copiado para a área de transferência.', 'sucesso');
      } else {
        const html = await api.carteira.exportarHtml(contaId, filtros);
        if (Platform.OS === 'web') {
          await Print.printAsync({ html });
        } else {
          const { uri } = await Print.printToFileAsync({ html });
          if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
          else avisar('PDF gerado em ' + uri, 'sucesso');
        }
      }
      setFolhaExportar(false);
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Não foi possível exportar.', 'erro');
    } finally {
      setExportando(false);
    }
  }

  return (
    <Tela estilo={{ paddingTop: insets.top + 8 }}>
      <View style={{ paddingVertical: 12, gap: 6 }}>
        <Texto variante="display">Extrato</Texto>
        <Texto variante="legenda" suave>
          Tudo que entrou e saiu da carteira.
        </Texto>
      </View>

      <View style={{ gap: 12 }}>
        <Campo
          placeholder="Buscar por loja, item ou código"
          icone="busca"
          value={busca}
          onChangeText={setBusca}
          autoCapitalize="none"
          returnKeyType="search"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Pilula titulo="Todas as lojas" ativa={loja === 'todas'} onPress={() => setLoja('todas')} />
          {LOJAS.map((l) => (
            <Pilula key={l.id} titulo={l.nome} ativa={loja === l.id} onPress={() => setLoja(l.id)} />
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {(
            [
              { v: 'todos', r: 'Tudo' },
              { v: 'debito', r: 'Compras' },
              { v: 'credito', r: 'Recargas' },
            ] as const
          ).map((o) => (
            <Pilula key={o.v} titulo={o.r} ativa={tipo === o.v} onPress={() => setTipo(o.v)} />
          ))}
          {(
            [
              { v: '7d', r: '7 dias' },
              { v: '30d', r: '30 dias' },
              { v: '90d', r: '90 dias' },
              { v: 'tudo', r: 'Tudo' },
            ] as const
          ).map((o) => (
            <Pilula
              key={o.v}
              titulo={o.r}
              ativa={periodo === o.v}
              onPress={() => setPeriodo(o.v)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={{ paddingTop: 18, gap: 16 }}>
        <GraficoMensal dados={mensal.dados} carregando={mensal.carregando} />

        <Superficie preenchimento={16}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Texto variante="subtitulo" style={{ flex: 1 }}>
              Movimentações
            </Texto>
            <Botao
              titulo="Exportar"
              tipo="secundario"
              icone="baixar"
              compacto
              largura="auto"
              onPress={() => setFolhaExportar(true)}
            />
          </View>

          {lista.erro ? (
            <EstadoErro mensagem={lista.erro} aoTentarNovamente={lista.recarregar} />
          ) : lista.carregando ? (
            <View style={{ paddingTop: 10 }}>
              <EsqueletoLista linhas={5} />
            </View>
          ) : grupos.length === 0 ? (
            <EstadoVazio
              icone="busca"
              titulo="Nenhuma transação encontrada"
              descricao="Tente ampliar o período ou limpar os filtros."
              acao={{
                titulo: 'Limpar filtros',
                onPress: () => {
                  setBusca('');
                  setLoja('todas');
                  setTipo('todos');
                  setPeriodo('tudo');
                },
              }}
            />
          ) : (
            grupos.map((grupo) => (
              <View key={grupo.dia} style={{ paddingTop: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 2 }}>
                  <Texto variante="micro" suave>
                    {grupo.rotulo.toUpperCase()}
                  </Texto>
                  <View style={{ flex: 1, height: 1, backgroundColor: cores.borda }} />
                  <Texto variante="micro" suave tabular>
                    {formatarReais(grupo.totalCentavos)}
                  </Texto>
                </View>
                {grupo.itens.map((t) => (
                  <LinhaTransacao key={t.id} transacao={t} />
                ))}
              </View>
            ))
          )}
        </Superficie>
      </View>

      <Folha
        visivel={folhaExportar}
        aoFechar={() => setFolhaExportar(false)}
        titulo="Exportar extrato"
        subtitulo="Gera o arquivo com os filtros aplicados agora."
      >
        <View style={{ gap: 10 }}>
          <Botao
            titulo="Gerar PDF"
            icone="baixar"
            carregando={exportando}
            onPress={() => void exportar('pdf')}
          />
          <Botao
            titulo="Copiar CSV"
            tipo="secundario"
            icone="copiar"
            carregando={exportando}
            onPress={() => void exportar('csv')}
          />
        </View>
      </Folha>
      <View style={{ height: 24 }} />
    </Tela>
  );
}

interface Grupo {
  dia: string;
  rotulo: string;
  totalCentavos: number;
  itens: Transacao[];
}

function agruparPorDia(transacoes: Transacao[]): Grupo[] {
  const mapa = new Map<string, Transacao[]>();
  for (const t of transacoes) {
    const dia = diaSP(t.criadaEm);
    mapa.set(dia, [...(mapa.get(dia) ?? []), t]);
  }
  return Array.from(mapa.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dia, itens]) => ({
      dia,
      rotulo: rotuloDoDia(itens[0].criadaEm),
      itens,
      totalCentavos: itens
        .filter((t) => t.status === 'aprovada' && t.tipo === 'debito')
        .reduce((s, t) => s + t.valorCentavos, 0),
    }));
}

function GraficoMensal({
  dados,
  carregando,
}: {
  dados: { mes: string; totalCentavos: number; totalMesAnteriorCentavos: number; porLoja: { lojaId: LojaId; nome: string; totalCentavos: number }[] } | null;
  carregando: boolean;
}) {
  const { cores } = useTema();
  if (carregando || !dados) {
    return <Esqueleto altura={168} arredondamento={raio.lg} />;
  }
  const maximo = Math.max(1, ...dados.porLoja.map((l) => l.totalCentavos));
  const delta = variacao(dados.totalCentavos, dados.totalMesAnteriorCentavos);

  return (
    <Superficie preenchimento={16}>
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Texto variante="legenda" suave>
              Gasto em {nomeDoMes(dados.mes)}
            </Texto>
            <Texto variante="titulo" tabular>
              {formatarReais(dados.totalCentavos)}
            </Texto>
          </View>
          {delta && (
            <Texto
              variante="legenda"
              peso="600"
              cor={dados.totalCentavos > dados.totalMesAnteriorCentavos ? cores.alerta : cores.sucesso}
            >
              {delta} vs. mesmo período
            </Texto>
          )}
        </View>

        <View style={{ gap: 10 }}>
          {dados.porLoja.map((l) => (
            <View key={l.lojaId} style={{ gap: 5 }}>
              <View style={{ flexDirection: 'row' }}>
                <Texto variante="legenda" style={{ flex: 1 }}>
                  {l.nome}
                </Texto>
                <Texto variante="legenda" suave tabular>
                  {formatarReais(l.totalCentavos)}
                </Texto>
              </View>
              <View
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: cores.superficieAlt,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: 8,
                    width: `${Math.round((l.totalCentavos / maximo) * 100)}%`,
                    backgroundColor: cores.marca,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    </Superficie>
  );
}
