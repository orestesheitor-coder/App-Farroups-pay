import React, { useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api, ErroApi } from '@/services';
import { useSessao } from '@/state/sessao';
import { useAsync } from '@/lib/hooks';
import { LOJAS } from '@/services/mock/seed';
import { exigeAutenticacao, lojaAberta } from '@/domain/regras';
import type { ItemPdv, LojaId, Transacao } from '@/domain/types';
import { formatarHora, formatarReais } from '@/lib/format';
import { id as gerarId } from '@/lib/id';
import { raio, useTema } from '@/theme';
import {
  Aviso,
  Botao,
  Cabecalho,
  CheckAnimado,
  Divisor,
  EstadoErro,
  Esqueleto,
  Icone,
  MarcaLoja,
  Selo,
  Superficie,
  Tela,
  Texto,
  Valor,
} from '@/ui';
import { FolhaAutenticacao } from '@/features/pagamento/FolhaAutenticacao';

type Etapa = 'montar' | 'processando' | 'aprovado' | 'recusado';

export default function PagarNaLoja() {
  const { loja: lojaParam } = useLocalSearchParams<{ loja: string }>();
  const { usuario, alunoAtivoId, invalidar, versao } = useSessao();
  const { cores } = useTema();
  const router = useRouter();

  const loja = LOJAS.find((l) => l.id === lojaParam);
  const alunoId = alunoAtivoId ?? usuario?.alunoId ?? '';
  const resumo = useAsync(() => api.carteira.resumo(alunoId), [alunoId, versao]);
  const cobranca = useAsync(
    async () => (loja ? api.pagamentos.cobrancaAberta(loja.id as LojaId) : null),
    [lojaParam, versao],
    { recarregarAoFocar: true },
  );

  const [itens, setItens] = useState<ItemPdv[]>([]);
  const [etapa, setEtapa] = useState<Etapa>('montar');
  const [pedirPin, setPedirPin] = useState(false);
  const [erroPin, setErroPin] = useState<string | null>(null);
  const [recusa, setRecusa] = useState<{ mensagem: string; motivo: string } | null>(null);
  const [transacao, setTransacao] = useState<Transacao | null>(null);
  const chave = useRef(gerarId('idem'));

  const daCobranca = cobranca.dados;
  const totalCentavos = daCobranca
    ? daCobranca.valorCentavos
    : itens.reduce((s, i) => s + i.valorCentavos, 0);

  const conta = resumo.dados?.conta;
  const cartao = resumo.dados?.cartoes.find((c) => c.ativo);
  const aberta = loja ? lojaAberta(loja) : false;

  const avisoTopo = useMemo(() => {
    if (!loja || !conta) return null;
    if (conta.limites.lojasBloqueadas.includes(loja.id)) {
      return `Compras no ${loja.nome} foram bloqueadas pelo responsável.`;
    }
    if (cartao?.bloqueado) return 'Cartão bloqueado. Desbloqueie no app para pagar.';
    if (!aberta) return `${loja.nome} está fechado agora. Abre às ${loja.abre}.`;
    return null;
  }, [loja, conta, cartao, aberta]);

  async function autorizar(auth?: { pin?: string; biometria?: boolean }) {
    if (!conta || !loja) return;
    setEtapa('processando');
    setErroPin(null);
    try {
      const t = await api.pagamentos.autorizar({
        contaId: conta.id,
        lojaId: loja.id,
        valorCentavos: totalCentavos,
        itens: daCobranca?.itens ?? itens,
        forma: 'cartao',
        cobrancaId: daCobranca?.id,
        chaveIdempotencia: chave.current,
        ...auth,
      });
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setTransacao(t);
      setPedirPin(false);
      setEtapa('aprovado');
      invalidar();
    } catch (e) {
      const erro = e instanceof ErroApi ? e : null;
      if (erro?.codigo === 'pin_incorreto') {
        setErroPin(erro.message);
        setEtapa('montar');
        setPedirPin(true);
        return;
      }
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setRecusa({
        mensagem: erro?.message ?? 'Não foi possível concluir o pagamento.',
        motivo: erro?.codigo ?? 'erro',
      });
      setEtapa('recusado');
    }
  }

  function iniciar() {
    chave.current = gerarId('idem');
    if (exigeAutenticacao(totalCentavos)) {
      setPedirPin(true);
      return;
    }
    void autorizar();
  }

  if (!loja) {
    return (
      <Tela>
        <Cabecalho titulo="Loja" />
        <EstadoErro mensagem="Estabelecimento fora da rede Farroups-pay." />
      </Tela>
    );
  }

  if (etapa === 'aprovado' && transacao) {
    return (
      <Recibo
        transacao={transacao}
        lojaNome={loja.nome}
        alunoId={alunoId}
        aoFechar={() => router.replace('/(aluno)')}
      />
    );
  }

  if (etapa === 'recusado' && recusa) {
    return (
      <Tela
        aoFinal={
          <View style={{ gap: 10 }}>
            {recusa.motivo === 'saldo_insuficiente' && (
              <Botao titulo="Adicionar saldo" icone="mais" onPress={() => router.replace('/recarga')} />
            )}
            {recusa.motivo === 'cartao_bloqueado' && (
              <Botao
                titulo="Ir para o cartão"
                icone="cartao"
                onPress={() => router.replace('/(aluno)/cartao')}
              />
            )}
            <Botao
              titulo="Tentar de novo"
              tipo={recusa.motivo === 'saldo_insuficiente' ? 'secundario' : 'primario'}
              onPress={() => {
                setRecusa(null);
                setEtapa('montar');
              }}
            />
            <Botao titulo="Voltar" tipo="fantasma" onPress={() => router.back()} />
          </View>
        }
      >
        <Cabecalho titulo="Pagamento recusado" subtitulo={loja.nome} />
        <View style={{ alignItems: 'center', paddingVertical: 30, gap: 16 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: cores.alertaSuave,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icone nome="x" tamanho={40} cor={cores.alerta} />
          </View>
          <Texto variante="titulo" centro>
            {recusa.mensagem}
          </Texto>
          <Texto variante="legenda" suave centro style={{ maxWidth: 300 }}>
            Nada foi debitado. O recibo desta tentativa fica registrado no extrato.
          </Texto>
        </View>
      </Tela>
    );
  }

  return (
    <Tela
      aoFinal={
        <Botao
          titulo={
            etapa === 'processando'
              ? 'Autorizando...'
              : `Aproximar cartão · ${formatarReais(totalCentavos)}`
          }
          icone="nfc"
          carregando={etapa === 'processando'}
          disabled={totalCentavos <= 0 || !conta}
          onPress={iniciar}
        />
      }
    >
      <Cabecalho
        titulo={loja.nome}
        subtitulo={loja.descricao}
        acao={<Selo texto={aberta ? 'Aberta' : 'Fechada'} tom={aberta ? 'sucesso' : 'neutro'} />}
      />

      {resumo.erro ? (
        <EstadoErro mensagem={resumo.erro} aoTentarNovamente={resumo.recarregar} />
      ) : resumo.carregando ? (
        <View style={{ gap: 14 }}>
          <Esqueleto altura={120} arredondamento={raio.lg} />
          <Esqueleto altura={220} arredondamento={raio.lg} />
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {avisoTopo && <Aviso tom="alerta" icone="alerta" texto={avisoTopo} />}

          <Superficie preenchimento={20}>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Texto variante="legenda" suave>
                {daCobranca ? 'Cobrança lançada no caixa' : 'Valor na maquininha'}
              </Texto>
              <Valor centavos={totalCentavos} tamanho={40} />
              <Texto variante="legenda" suave>
                Saldo disponível: {formatarReais(conta?.saldoCentavos ?? 0)} · Limite de hoje:{' '}
                {formatarReais(resumo.dados?.restanteHojeCentavos ?? 0)}
              </Texto>
              {exigeAutenticacao(totalCentavos) && (
                <Selo texto="Pede PIN ou biometria" tom="marca" />
              )}
            </View>
          </Superficie>

          {daCobranca ? (
            <Superficie preenchimento={16}>
              <Texto variante="legenda" peso="600" suave style={{ marginBottom: 10 }}>
                ITENS DO CAIXA
              </Texto>
              {daCobranca.itens.map((i, idx) => (
                <View key={idx} style={{ flexDirection: 'row', paddingVertical: 6 }}>
                  <Texto variante="corpo" style={{ flex: 1 }}>
                    {i.nome}
                  </Texto>
                  <Texto variante="corpo" tabular suave>
                    {formatarReais(i.valorCentavos)}
                  </Texto>
                </View>
              ))}
              <Divisor />
              <Texto variante="legenda" suave style={{ paddingTop: 8 }}>
                Cobrança aberta às {formatarHora(daCobranca.criadaEm)} pelo caixa da loja.
              </Texto>
            </Superficie>
          ) : (
            <Superficie preenchimento={16}>
              <Texto variante="legenda" peso="600" suave style={{ marginBottom: 10 }}>
                O QUE ESTÁ SENDO COBRADO
              </Texto>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {loja.itensFrequentes.map((item) => {
                  const quantidade = itens.filter((i) => i.nome === item.nome).length;
                  return (
                    <Pressable
                      key={item.nome}
                      accessibilityRole="button"
                      accessibilityLabel={`Adicionar ${item.nome}, ${formatarReais(item.valorCentavos)}`}
                      onPress={() => setItens((atual) => [...atual, item])}
                      style={({ pressed }) => ({
                        paddingHorizontal: 12,
                        minHeight: 44,
                        justifyContent: 'center',
                        borderRadius: raio.md,
                        borderWidth: 1,
                        borderColor: quantidade ? cores.marca : cores.borda,
                        backgroundColor: pressed ? cores.superficieToque : 'transparent',
                      })}
                    >
                      <Texto variante="legenda" peso="600">
                        {item.nome} {quantidade > 1 ? `×${quantidade}` : ''}
                      </Texto>
                      <Texto variante="legenda" suave tabular>
                        {formatarReais(item.valorCentavos)}
                      </Texto>
                    </Pressable>
                  );
                })}
              </View>
              {itens.length > 0 && (
                <View style={{ paddingTop: 12 }}>
                  <Botao
                    titulo="Limpar itens"
                    tipo="fantasma"
                    compacto
                    onPress={() => setItens([])}
                  />
                </View>
              )}
            </Superficie>
          )}

          <PulsoNfc ativo={etapa === 'processando'} />

          <Aviso
            icone="nfc"
            texto="Na loja, basta aproximar o cartão da maquininha. Sem cartão em mãos, mostre o QR Code do app."
          />
        </View>
      )}

      <FolhaAutenticacao
        visivel={pedirPin}
        valorCentavos={totalCentavos}
        biometriaAtiva={!!usuario?.biometriaAtiva}
        erro={erroPin}
        aoFechar={() => {
          setPedirPin(false);
          setEtapa('montar');
        }}
        aoConfirmar={(dados) => void autorizar(dados)}
      />
      <View style={{ height: 16 }} />
    </Tela>
  );
}

/** Onda de aproximação: some quando a transação termina. */
function PulsoNfc({ ativo }: { ativo: boolean }) {
  const { cores } = useTema();
  const pulso = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!ativo) {
      pulso.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.timing(pulso, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [ativo, pulso]);

  if (!ativo) return null;

  return (
    <View style={{ alignItems: 'center', paddingVertical: 12 }}>
      <Animated.View
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          borderWidth: 2,
          borderColor: cores.marca,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
          transform: [
            { scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.25] }) },
          ],
        }}
      >
        <Icone nome="nfc" tamanho={30} cor={cores.marca} />
      </Animated.View>
      <Texto variante="legenda" suave style={{ marginTop: 8 }}>
        Aproxime o cartão da maquininha
      </Texto>
    </View>
  );
}

function Recibo({
  transacao,
  lojaNome,
  alunoId,
  aoFechar,
}: {
  transacao: Transacao;
  lojaNome: string;
  alunoId: string;
  aoFechar: () => void;
}) {
  const { cores } = useTema();
  const router = useRouter();
  // Relê o saldo já debitado em vez de calculá-lo na tela.
  const depois = useAsync(() => api.carteira.resumo(alunoId), [alunoId, transacao.id]);

  return (
    <Tela
      rolagem={false}
      estilo={{ flex: 1 }}
      aoFinal={
        <View style={{ gap: 10 }}>
          <Botao titulo="Concluir" onPress={aoFechar} />
          <Botao
            titulo="Ver comprovante"
            tipo="fantasma"
            onPress={() => router.replace(`/transacao/${transacao.id}`)}
          />
        </View>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 40 }}>
        <View style={{ alignItems: 'center', gap: 18 }}>
          <CheckAnimado cor={cores.sucesso} fundo={cores.sucessoSuave} />
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Texto variante="titulo">Pagamento aprovado</Texto>
            <Texto variante="legenda" suave>
              {lojaNome} · {formatarHora(transacao.criadaEm)}
            </Texto>
          </View>
          <Valor centavos={transacao.valorCentavos} tamanho={40} sinal="-" />
          <Superficie preenchimento={16} style={{ width: '100%' }}>
            <View style={{ gap: 10 }}>
              {(transacao.itens ?? []).map((i, idx) => (
                <View key={idx} style={{ flexDirection: 'row' }}>
                  <Texto variante="corpo" style={{ flex: 1 }}>
                    {i.nome}
                  </Texto>
                  <Texto variante="corpo" tabular suave>
                    {formatarReais(i.valorCentavos)}
                  </Texto>
                </View>
              ))}
              {(transacao.itens ?? []).length > 0 && <Divisor />}
              <View style={{ flexDirection: 'row' }}>
                <Texto variante="legenda" suave style={{ flex: 1 }}>
                  Saldo restante
                </Texto>
                {depois.carregando || !depois.dados ? (
                  <Esqueleto altura={16} largura={80} />
                ) : (
                  <Texto variante="corpoForte" tabular>
                    {formatarReais(depois.dados.conta.saldoCentavos)}
                  </Texto>
                )}
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Texto variante="legenda" suave style={{ flex: 1 }}>
                  Identificador
                </Texto>
                <Texto variante="legenda" suave>
                  {transacao.id}
                </Texto>
              </View>
            </View>
          </Superficie>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MarcaLoja lojaId={transacao.lojaId} tamanho={28} />
            <Texto variante="legenda" suave>
              Recibo enviado ao responsável
            </Texto>
          </View>
        </View>
      </ScrollView>
    </Tela>
  );
}
