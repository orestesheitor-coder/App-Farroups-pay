import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { useAsync } from '@/lib/hooks';
import { formatarReais, iniciais, primeiroNome } from '@/lib/format';
import { LOJAS } from '@/services/mock/seed';
import { raio, useTema } from '@/theme';
import {
  Botao,
  BotaoIcone,
  EstadoErro,
  EstadoVazio,
  Esqueleto,
  LARGURA_MAXIMA,
  Selo,
  Superficie,
  Texto,
  Toque,
  Valor,
} from '@/ui';

export default function PainelResponsavel() {
  const { usuario, versao, definirAlunoAtivo } = useSessao();
  const { cores } = useTema();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const estado = useAsync(
    async () => (usuario ? api.responsavel.alunos(usuario.id) : []),
    [usuario?.id, versao],
    { recarregarAoFocar: true },
  );

  const alunos = estado.dados ?? [];
  const total = alunos.reduce((s, a) => s + a.conta.saldoCentavos, 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: cores.fundo }}
      contentContainerStyle={{ paddingBottom: 32, paddingTop: insets.top + 8 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={estado.atualizando} onRefresh={estado.recarregar} />
      }
    >
      <View
        style={{
          width: '100%',
          maxWidth: LARGURA_MAXIMA,
          alignSelf: 'center',
          paddingHorizontal: 20,
          gap: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Texto variante="legenda" suave>
              Responsável
            </Texto>
            <Texto variante="subtitulo">{usuario ? primeiroNome(usuario.nome) : ''}</Texto>
          </View>
          <BotaoIcone
            nome="sino"
            rotulo="Notificações"
            onPress={() => router.push('/notificacoes')}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Texto variante="legenda" suave>
            Saldo somado dos alunos
          </Texto>
          {estado.carregando ? (
            <Esqueleto altura={44} largura="55%" />
          ) : (
            <Valor centavos={total} tamanho={40} />
          )}
        </View>

        {estado.erro ? (
          <EstadoErro mensagem={estado.erro} aoTentarNovamente={estado.recarregar} />
        ) : estado.carregando ? (
          <View style={{ gap: 12 }}>
            <Esqueleto altura={148} arredondamento={raio.lg} />
            <Esqueleto altura={148} arredondamento={raio.lg} />
          </View>
        ) : alunos.length === 0 ? (
          <EstadoVazio
            icone="usuarios"
            titulo="Nenhum aluno vinculado"
            descricao="Use o código enviado pela secretaria para vincular seu filho ou filha."
            acao={{ titulo: 'Vincular aluno', onPress: () => router.push('/(auth)/vincular') }}
          />
        ) : (
          alunos.map(({ aluno, conta, gastoNoDiaCentavos }) => {
            const restante = Math.max(0, conta.limites.diarioCentavos - gastoNoDiaCentavos);
            return (
              <Superficie key={aluno.id} preenchimento={18}>
                <View style={{ gap: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: raio.pill,
                        backgroundColor: cores.marcaSuave,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Texto variante="corpoForte" cor={cores.marca}>
                        {iniciais(aluno.nome)}
                      </Texto>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Texto variante="corpoForte">{aluno.nome}</Texto>
                      <Texto variante="legenda" suave>
                        {aluno.turma} · matrícula {aluno.matricula}
                      </Texto>
                    </View>
                    <Toque
                      rotulo={`Abrir ajustes de ${aluno.nome}`}
                      onPress={() => {
                        definirAlunoAtivo(aluno.id);
                        router.push(`/(responsavel)/aluno/${aluno.id}`);
                      }}
                    >
                      <Selo texto="Ajustar" tom="marca" />
                    </Toque>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Texto variante="legenda" suave>
                        Saldo
                      </Texto>
                      <Texto variante="subtitulo" tabular>
                        {formatarReais(conta.saldoCentavos)}
                      </Texto>
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Texto variante="legenda" suave>
                        Gasto hoje
                      </Texto>
                      <Texto variante="subtitulo" tabular>
                        {formatarReais(gastoNoDiaCentavos)}
                      </Texto>
                    </View>
                  </View>

                  <View style={{ gap: 6 }}>
                    <View
                      style={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: cores.superficieAlt,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          height: 6,
                          width: `${Math.min(100, (gastoNoDiaCentavos / Math.max(1, conta.limites.diarioCentavos)) * 100)}%`,
                          backgroundColor: restante === 0 ? cores.alerta : cores.marca,
                        }}
                      />
                    </View>
                    <Texto variante="legenda" suave>
                      Restam {formatarReais(restante)} do limite diário de{' '}
                      {formatarReais(conta.limites.diarioCentavos)}
                    </Texto>
                    {conta.limites.lojasBloqueadas.length > 0 && (
                      <Texto variante="legenda" cor={cores.alerta}>
                        Bloqueada:{' '}
                        {conta.limites.lojasBloqueadas
                          .map((l) => LOJAS.find((x) => x.id === l)?.nome)
                          .join(', ')}
                      </Texto>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Botao
                        titulo="Adicionar saldo"
                        icone="mais"
                        compacto
                        onPress={() => {
                          definirAlunoAtivo(aluno.id);
                          router.push('/recarga');
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Botao
                        titulo="Ver extrato"
                        tipo="secundario"
                        icone="recibo"
                        compacto
                        onPress={() => {
                          definirAlunoAtivo(aluno.id);
                          router.push(`/(responsavel)/aluno/${aluno.id}`);
                        }}
                      />
                    </View>
                  </View>
                </View>
              </Superficie>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
