import React, { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { useAsync } from '@/lib/hooks';
import { formatarReais, primeiroNome } from '@/lib/format';
import { raio, useTema } from '@/theme';
import {
  BotaoIcone,
  Botao,
  EstadoErro,
  EstadoVazio,
  Esqueleto,
  EsqueletoLista,
  LARGURA_MAXIMA,
  Selo,
  Superficie,
  Texto,
  Toque,
  Valor,
  Icone,
} from '@/ui';
import { FaixaLojas } from '@/features/carteira/FaixaLojas';
import { AssinaturaCanto } from '@/features/comum/MarcaFarroups';
import { FundoInfantil } from '@/ui/Tela';
import { LinhaTransacao } from '@/features/carteira/LinhaTransacao';
import { CartaoVirtual } from '@/ui/CartaoVirtual';

export default function Carteira() {
  const { usuario, alunoAtivoId, versao } = useSessao();
  const { cores, segmento } = useTema();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [oculto, setOculto] = useState(false);

  const alunoId = alunoAtivoId ?? usuario?.alunoId ?? '';
  const estado = useAsync(() => api.carteira.resumo(alunoId), [alunoId, versao], {
    recarregarAoFocar: true,
  });

  const naoLidas = useAsync(
    async () => (usuario ? (await api.notificacoes.listar(usuario.id)).filter((n) => !n.lida).length : 0),
    [usuario?.id, versao],
    { recarregarAoFocar: true },
  );

  const resumo = estado.dados;
  const cartao = resumo?.cartoes.find((c) => c.ativo) ?? resumo?.cartoes[0];
  const saudacao = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      {segmento === 'infantil' && <FundoInfantil />}
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 32, paddingTop: insets.top + 8 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={estado.atualizando}
          onRefresh={estado.recarregar}
          tintColor={cores.textoSuave}
        />
      }
    >
      <View style={{ width: '100%', maxWidth: LARGURA_MAXIMA, alignSelf: 'center' }}>
        <View
          style={{
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 48,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Texto variante="legenda" suave>
              {saudacao}
            </Texto>
            <Texto variante="subtitulo">
              {resumo ? primeiroNome(resumo.aluno.nome) : usuario?.nome.split(' ')[0]}
            </Texto>
          </View>
          <View>
            <BotaoIcone
              nome="sino"
              rotulo="Notificações"
              onPress={() => router.push('/notificacoes')}
            />
            {!!naoLidas.dados && (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  backgroundColor: cores.marca,
                }}
              />
            )}
          </View>
        </View>

        {estado.erro && !resumo ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EstadoErro mensagem={estado.erro} aoTentarNovamente={estado.recarregar} />
          </View>
        ) : (
          <>
            <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 20 }}>
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Texto variante="legenda" suave>
                    Saldo disponível
                  </Texto>
                  <Toque
                    rotulo={oculto ? 'Mostrar saldo' : 'Ocultar saldo'}
                    onPress={() => setOculto((o) => !o)}
                  >
                    <Icone
                      nome={oculto ? 'olhoFechado' : 'olho'}
                      tamanho={17}
                      cor={cores.textoSuave}
                    />
                  </Toque>
                </View>

                {estado.carregando || !resumo ? (
                  <Esqueleto altura={44} largura="62%" />
                ) : (
                  <Valor centavos={resumo.conta.saldoCentavos} tamanho={42} oculto={oculto} />
                )}

                {resumo && (
                  <View style={{ gap: 6, marginTop: 2 }}>
                    <View
                      style={{
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: cores.superficieAlt,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          height: 5,
                          width: `${Math.min(
                            100,
                            (resumo.gastoNoDiaCentavos / Math.max(1, resumo.conta.limites.diarioCentavos)) * 100,
                          )}%`,
                          backgroundColor: cores.marca,
                        }}
                      />
                    </View>
                    <Texto variante="legenda" suave>
                      Limite de hoje: {formatarReais(resumo.restanteHojeCentavos)} de{' '}
                      {formatarReais(resumo.conta.limites.diarioCentavos)} disponíveis
                    </Texto>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Botao
                    titulo="Adicionar saldo"
                    icone="mais"
                    compacto
                    onPress={() => router.push('/recarga')}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Botao
                    titulo="Meu cartão"
                    tipo="secundario"
                    icone="cartao"
                    compacto
                    onPress={() => router.push('/(aluno)/cartao')}
                  />
                </View>
              </View>

              {cartao && resumo && (
                <Toque onPress={() => router.push('/(aluno)/cartao')} rotulo="Abrir meu cartão">
                  <CartaoVirtual cartao={cartao} nome={resumo.aluno.nome} compacto />
                </Toque>
              )}
            </View>

            <View style={{ paddingTop: 24, gap: 12 }}>
              <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' }}>
                <Texto variante="subtitulo" style={{ flex: 1 }}>
                  Onde pagar
                </Texto>
                <Selo texto="3 lojas" />
              </View>
              <View style={{ paddingLeft: 20 }}>
                {estado.carregando || !resumo ? (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Esqueleto altura={112} largura={152} arredondamento={raio.lg} />
                    <Esqueleto altura={112} largura={152} arredondamento={raio.lg} />
                  </View>
                ) : (
                  <FaixaLojas
                    lojas={resumo.lojas}
                    bloqueadas={resumo.conta.limites.lojasBloqueadas}
                  />
                )}
              </View>
            </View>

            <View style={{ paddingHorizontal: 20, paddingTop: 26 }}>
              <Superficie preenchimento={16}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Texto variante="subtitulo" style={{ flex: 1 }}>
                    Últimas transações
                  </Texto>
                  <Toque rotulo="Ver extrato completo" onPress={() => router.push('/(aluno)/extrato')}>
                    <Texto variante="legenda" peso="600" cor={cores.marca}>
                      Ver extrato
                    </Texto>
                  </Toque>
                </View>

                {estado.carregando || !resumo ? (
                  <View style={{ paddingTop: 10 }}>
                    <EsqueletoLista linhas={3} />
                  </View>
                ) : resumo.ultimas.length === 0 ? (
                  <EstadoVazio
                    titulo="Nada por aqui ainda"
                    descricao="Assim que houver uma recarga ou compra, ela aparece nesta lista."
                    acao={{ titulo: 'Adicionar saldo', onPress: () => router.push('/recarga') }}
                  />
                ) : (
                  resumo.ultimas.map((t) => <LinhaTransacao key={t.id} transacao={t} />)
                )}
              </Superficie>
            </View>
          </>
        )}
      </View>
    </ScrollView>
      <AssinaturaCanto />
    </View>
  );
}
