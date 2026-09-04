import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { useAsync } from '@/lib/hooks';
import { LOJAS } from '@/services/mock/seed';
import { podeEstornar } from '@/domain/regras';
import type { Transacao } from '@/domain/types';
import { formatarHora, formatarReais } from '@/lib/format';
import { useTema } from '@/theme';
import {
  Botao,
  Campo,
  EstadoErro,
  EstadoVazio,
  EsqueletoLista,
  Folha,
  MarcaLoja,
  Selo,
  Superficie,
  Tela,
  Texto,
  Valor,
  useAlerta,
} from '@/ui';

export default function FilaDoDia() {
  const { usuario, versao, invalidar } = useSessao();
  const { cores } = useTema();
  const { avisar } = useAlerta();
  const insets = useSafeAreaInsets();

  const loja = LOJAS.find((l) => l.id === usuario?.lojaId);
  const fila = useAsync(
    async () => (loja ? api.lojista.filaDoDia(loja.id) : []),
    [loja?.id, versao],
    { recarregarAoFocar: true },
  );

  const [alvo, setAlvo] = useState<Transacao | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const lista = fila.dados ?? [];
  const aprovadas = lista.filter((t) => t.tipo === 'debito' && t.status === 'aprovada');
  const total = aprovadas.reduce((s, t) => s + t.valorCentavos, 0);

  async function estornar() {
    if (!alvo || !usuario) return;
    setEnviando(true);
    setErro(null);
    try {
      await api.lojista.estornar(alvo.id, justificativa, senha, usuario.id);
      setAlvo(null);
      setJustificativa('');
      setSenha('');
      fila.recarregar();
      invalidar();
      avisar('Estorno concluído. O valor voltou para o saldo do aluno.', 'sucesso');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível estornar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela estilo={{ paddingTop: insets.top + 8 }}>
      <View style={{ paddingVertical: 12, gap: 6 }}>
        <Texto variante="display">Fila do dia</Texto>
        <Texto variante="legenda" suave>
          {loja?.nome} · {aprovadas.length} vendas aprovadas
        </Texto>
      </View>

      <View style={{ gap: 16 }}>
        <Superficie preenchimento={18}>
          <View style={{ gap: 6 }}>
            <Texto variante="legenda" suave>
              Total acumulado hoje
            </Texto>
            <Valor centavos={total} tamanho={36} cor={cores.sucesso} />
          </View>
        </Superficie>

        <Superficie preenchimento={16}>
          {fila.erro ? (
            <EstadoErro mensagem={fila.erro} aoTentarNovamente={fila.recarregar} />
          ) : fila.carregando ? (
            <EsqueletoLista linhas={4} />
          ) : lista.length === 0 ? (
            <EstadoVazio
              icone="recibo"
              titulo="Nenhuma venda hoje"
              descricao="As transações aparecem aqui assim que o primeiro aluno pagar."
            />
          ) : (
            lista.map((t, i) => (
              <View
                key={t.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: cores.borda,
                }}
              >
                <MarcaLoja
                  lojaId={t.tipo === 'estorno' ? undefined : t.lojaId}
                  tom={t.status === 'recusada' ? 'alerta' : t.tipo === 'estorno' ? 'sucesso' : 'marca'}
                  tamanho={40}
                />
                <View style={{ flex: 1, gap: 3 }}>
                  <Texto variante="corpoForte">{formatarReais(t.valorCentavos)}</Texto>
                  <Texto variante="legenda" suave>
                    {formatarHora(t.criadaEm)} ·{' '}
                    {t.itens?.map((i2) => i2.nome).join(', ') || 'Sem itens detalhados'}
                  </Texto>
                </View>
                {t.status === 'aprovada' && t.tipo === 'debito' ? (
                  podeEstornar(t) ? (
                    <Botao
                      titulo="Estornar"
                      tipo="secundario"
                      compacto
                      largura="auto"
                      onPress={() => setAlvo(t)}
                    />
                  ) : (
                    <Selo texto="Fora do prazo" />
                  )
                ) : (
                  <Selo
                    texto={
                      t.status === 'recusada'
                        ? 'Recusada'
                        : t.status === 'estornada'
                          ? 'Estornada'
                          : 'Estorno'
                    }
                    tom={t.status === 'recusada' ? 'alerta' : 'neutro'}
                  />
                )}
              </View>
            ))
          )}
        </Superficie>

        <Texto variante="legenda" suave>
          Estornos são aceitos em até 24 horas e devolvem o valor ao saldo do aluno no app —
          nunca ao meio de pagamento original.
        </Texto>
      </View>

      <Folha
        visivel={!!alvo}
        aoFechar={() => setAlvo(null)}
        titulo="Estornar venda"
        subtitulo={alvo ? `${formatarReais(alvo.valorCentavos)} · ${formatarHora(alvo.criadaEm)}` : undefined}
      >
        <View style={{ gap: 12 }}>
          <Campo
            rotulo="Justificativa"
            placeholder="Ex.: pedido trocado no balcão"
            value={justificativa}
            onChangeText={setJustificativa}
          />
          <Campo
            rotulo="Senha do operador"
            segredo
            value={senha}
            onChangeText={setSenha}
            erro={erro}
            auxiliar="Na demonstração: farroupilha"
          />
          <Botao
            titulo="Confirmar estorno"
            tipo="perigo"
            carregando={enviando}
            disabled={justificativa.trim().length < 5 || senha.length === 0}
            onPress={() => void estornar()}
          />
        </View>
      </Folha>
      <View style={{ height: 24 }} />
    </Tela>
  );
}
