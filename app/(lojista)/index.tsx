import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { useAsync } from '@/lib/hooks';
import { LOJAS } from '@/services/mock/seed';
import type { Cobranca, ItemPdv } from '@/domain/types';
import { formatarHora, formatarReais, parseCentavos } from '@/lib/format';
import { raio, useTema } from '@/theme';
import {
  Aviso,
  Botao,
  BotaoIcone,
  Superficie,
  Tela,
  TecladoNumerico,
  Texto,
  Valor,
  useAlerta,
} from '@/ui';

export default function Cobrar() {
  const { usuario, versao, invalidar, sair } = useSessao();
  const { cores } = useTema();
  const { avisar } = useAlerta();
  const insets = useSafeAreaInsets();

  const loja = LOJAS.find((l) => l.id === usuario?.lojaId);
  const [digitos, setDigitos] = useState('');
  const [itens, setItens] = useState<ItemPdv[]>([]);
  const [cobranca, setCobranca] = useState<Cobranca | null>(null);
  const [enviando, setEnviando] = useState(false);

  const aberta = useAsync(
    async () => (loja ? api.pagamentos.cobrancaAberta(loja.id) : null),
    [loja?.id, versao],
    { recarregarAoFocar: true },
  );

  const atual = cobranca ?? aberta.dados;
  const centavos = itens.length ? itens.reduce((s, i) => s + i.valorCentavos, 0) : parseCentavos(digitos);

  async function abrir() {
    if (!loja || !usuario) return;
    setEnviando(true);
    try {
      const c = await api.lojista.abrirCobranca(loja.id, usuario.id, centavos, itens);
      setCobranca(c);
      invalidar();
      avisar('Cobrança lançada. Peça para o aluno aproximar o cartão.', 'sucesso');
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Não foi possível lançar a cobrança.', 'erro');
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar() {
    if (!atual) return;
    await api.lojista.cancelarCobranca(atual.id);
    setCobranca(null);
    setItens([]);
    setDigitos('');
    aberta.recarregar();
    invalidar();
    avisar('Cobrança cancelada.', 'neutro');
  }

  if (atual && atual.status === 'aberta') {
    return (
      <Tela
        estilo={{ paddingTop: insets.top + 8, flex: 1 }}
        rolagem={false}
        aoFinal={
          <View style={{ gap: 10 }}>
            <Botao
              titulo="Concluir e nova cobrança"
              onPress={() => {
                setCobranca(null);
                setItens([]);
                setDigitos('');
                aberta.recarregar();
              }}
            />
            <Botao titulo="Cancelar cobrança" tipo="perigo" onPress={() => void cancelar()} />
          </View>
        }
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <Texto variante="legenda" suave>
            Aguardando o aluno · {loja?.nome}
          </Texto>
          <Valor centavos={atual.valorCentavos} tamanho={48} />
          <Texto variante="corpo" suave centro style={{ maxWidth: 300 }}>
            Peça para o aluno aproximar o cartão da maquininha ou apresentar o QR Code do app.
          </Texto>
          <Superficie preenchimento={16} style={{ width: '100%' }}>
            <View style={{ gap: 8 }}>
              {atual.itens.length === 0 ? (
                <Texto variante="legenda" suave centro>
                  Cobrança sem itens detalhados
                </Texto>
              ) : (
                atual.itens.map((i, idx) => (
                  <View key={idx} style={{ flexDirection: 'row' }}>
                    <Texto variante="corpo" style={{ flex: 1 }}>
                      {i.nome}
                    </Texto>
                    <Texto variante="corpo" suave tabular>
                      {formatarReais(i.valorCentavos)}
                    </Texto>
                  </View>
                ))
              )}
              <Texto variante="legenda" suave>
                Aberta às {formatarHora(atual.criadaEm)} · código {atual.id}
              </Texto>
            </View>
          </Superficie>
        </View>
      </Tela>
    );
  }

  return (
    <Tela
      estilo={{ paddingTop: insets.top + 8, flex: 1 }}
      rolagem={false}
      aoFinal={
        <Botao
          titulo={centavos > 0 ? `Cobrar ${formatarReais(centavos)}` : 'Cobrar'}
          disabled={centavos <= 0}
          carregando={enviando}
          onPress={() => void abrir()}
        />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="legenda" suave>
            {loja?.nome ?? 'Loja'}
          </Texto>
          <Texto variante="subtitulo">{usuario?.nome}</Texto>
        </View>
        <BotaoIcone nome="sair" rotulo="Sair" onPress={() => void sair()} />
      </View>

      <View style={{ flex: 1, paddingTop: 8 }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingBottom: 12 }}
        >
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <Valor centavos={centavos} tamanho={46} cor={centavos ? cores.texto : cores.textoSuave} />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(loja?.itensFrequentes ?? []).map((item) => (
              <Pressable
                key={item.nome}
                accessibilityRole="button"
                accessibilityLabel={`Adicionar ${item.nome} por ${formatarReais(item.valorCentavos)}`}
                onPress={() => {
                  setDigitos('');
                  setItens((a) => [...a, item]);
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  minHeight: 44,
                  justifyContent: 'center',
                  borderRadius: raio.md,
                  borderWidth: 1,
                  borderColor: cores.borda,
                  backgroundColor: pressed ? cores.superficieToque : cores.superficie,
                })}
              >
                <Texto variante="legenda" peso="600">
                  {item.nome}
                </Texto>
                <Texto variante="legenda" suave tabular>
                  {formatarReais(item.valorCentavos)}
                </Texto>
              </Pressable>
            ))}
          </View>

          {itens.length > 0 && (
            <Botao
              titulo={`Limpar ${itens.length} ${itens.length === 1 ? 'item' : 'itens'}`}
              tipo="fantasma"
              compacto
              onPress={() => setItens([])}
            />
          )}

          <Aviso
            icone="escudo"
            texto="Cobranças ficam registradas com o operador que as lançou. Estornos exigem senha."
          />
        </ScrollView>

        <TecladoNumerico
          compacto
          mostrarVirgula={false}
          aoDigitar={(d) => {
            setItens([]);
            setDigitos((v) => (v + d).replace(/^0+/, '').slice(0, 6));
          }}
          aoApagar={() => {
            setItens([]);
            setDigitos((v) => v.slice(0, -1));
          }}
        />
      </View>
    </Tela>
  );
}
