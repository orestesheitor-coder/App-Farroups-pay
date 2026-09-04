import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '@/services';
import { useAsync } from '@/lib/hooks';
import { useSessao } from '@/state/sessao';
import { formatarDataHora, formatarReais } from '@/lib/format';
import { raio, useTema } from '@/theme';
import {
  Aviso,
  Botao,
  Cabecalho,
  Campo,
  Divisor,
  EstadoErro,
  Esqueleto,
  Folha,
  MarcaLoja,
  Selo,
  Superficie,
  Tela,
  Texto,
  useAlerta,
} from '@/ui';

export default function DetalheTransacao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cores } = useTema();
  const { avisar } = useAlerta();
  const { invalidar } = useSessao();
  const [contestacao, setContestacao] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const estado = useAsync(() => api.carteira.transacao(String(id)), [id]);
  const t = estado.dados;
  const credito = t?.tipo === 'credito' || t?.tipo === 'estorno';

  async function contestar() {
    if (!t) return;
    setEnviando(true);
    try {
      await api.carteira.contestar(t.id, motivo);
      estado.recarregar();
      invalidar();
      setContestacao(false);
      setMotivo('');
      avisar('Contestação enviada. A secretaria responde em até 2 dias úteis.', 'sucesso');
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Não foi possível abrir a contestação.', 'erro');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <Cabecalho titulo="Detalhe" subtitulo="Comprovante da transação" />

      {estado.erro ? (
        <EstadoErro mensagem={estado.erro} aoTentarNovamente={estado.recarregar} />
      ) : estado.carregando || !t ? (
        <View style={{ gap: 14 }}>
          <Esqueleto altura={140} arredondamento={raio.lg} />
          <Esqueleto altura={200} arredondamento={raio.lg} />
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Superficie preenchimento={20}>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <MarcaLoja
                lojaId={t.lojaId}
                tamanho={54}
                tom={t.status === 'recusada' ? 'alerta' : credito ? 'sucesso' : 'marca'}
              />
              <Texto variante="subtitulo" centro>
                {t.descricao}
              </Texto>
              <Texto
                variante="displayGrande"
                tabular
                cor={
                  t.status === 'recusada'
                    ? cores.textoSuave
                    : credito
                      ? cores.sucesso
                      : cores.texto
                }
              >
                {credito ? '+' : '−'} {formatarReais(t.valorCentavos)}
              </Texto>
              <Selo
                texto={
                  t.status === 'aprovada'
                    ? 'Aprovada'
                    : t.status === 'recusada'
                      ? 'Recusada'
                      : t.status === 'estornada'
                        ? 'Estornada'
                        : 'Pendente'
                }
                tom={
                  t.status === 'aprovada'
                    ? 'sucesso'
                    : t.status === 'recusada'
                      ? 'alerta'
                      : 'neutro'
                }
              />
              {t.mensagemRecusa && (
                <Texto variante="legenda" suave centro>
                  {t.mensagemRecusa}
                </Texto>
              )}
            </View>
          </Superficie>

          <Superficie preenchimento={16}>
            <View style={{ gap: 12 }}>
              <Item rotulo="Data e hora" valor={formatarDataHora(t.criadaEm)} />
              <Divisor />
              <Item
                rotulo="Forma"
                valor={
                  t.tipo === 'credito'
                    ? t.metodo === 'pix'
                      ? 'Pix'
                      : 'Cartão de crédito'
                    : t.forma === 'qrcode'
                      ? 'QR Code na maquininha'
                      : 'Aproximação do cartão'
                }
              />
              <Divisor />
              <Item rotulo="Identificador" valor={t.id} />
              {t.itens && t.itens.length > 0 && (
                <>
                  <Divisor />
                  <View style={{ gap: 8 }}>
                    <Texto variante="legenda" suave>
                      Itens
                    </Texto>
                    {t.itens.map((i, idx) => (
                      <View key={idx} style={{ flexDirection: 'row' }}>
                        <Texto variante="corpo" style={{ flex: 1 }}>
                          {i.nome}
                        </Texto>
                        <Texto variante="corpo" tabular suave>
                          {formatarReais(i.valorCentavos)}
                        </Texto>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </Superficie>

          {t.contestada ? (
            <Aviso
              icone="relogio"
              texto="Contestação em análise pela secretaria. Você recebe uma notificação quando houver resposta."
            />
          ) : (
            t.tipo === 'debito' &&
            t.status !== 'recusada' && (
              <Botao
                titulo="Contestar transação"
                tipo="fantasma"
                icone="alerta"
                onPress={() => setContestacao(true)}
              />
            )
          )}
        </View>
      )}

      <Folha
        visivel={contestacao}
        aoFechar={() => setContestacao(false)}
        titulo="Contestar transação"
        subtitulo="Conte o que aconteceu. A secretaria analisa junto com a loja."
      >
        <View style={{ gap: 12 }}>
          <Campo
            rotulo="Motivo"
            placeholder="Ex.: não recebi o produto"
            value={motivo}
            onChangeText={setMotivo}
            multiline
          />
          <Botao
            titulo="Enviar contestação"
            carregando={enviando}
            disabled={motivo.trim().length < 5}
            onPress={() => void contestar()}
          />
        </View>
      </Folha>
      <View style={{ height: 24 }} />
    </Tela>
  );
}

function Item({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Texto variante="legenda" suave style={{ flex: 1 }}>
        {rotulo}
      </Texto>
      <Texto variante="corpoForte" style={{ flexShrink: 1, textAlign: 'right' }}>
        {valor}
      </Texto>
    </View>
  );
}
