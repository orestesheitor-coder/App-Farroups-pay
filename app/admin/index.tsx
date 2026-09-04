import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { useAsync } from '@/lib/hooks';
import { formatarData, formatarDataHora, formatarReais } from '@/lib/format';
import { raio, useTema } from '@/theme';
import {
  Botao,
  Divisor,
  EstadoErro,
  Esqueleto,
  EsqueletoLista,
  LinhaLista,
  MarcaLoja,
  Selo,
  Seletor,
  Superficie,
  Tela,
  Texto,
  Valor,
} from '@/ui';

type Secao = 'visao' | 'cadastros' | 'auditoria';

export default function PainelAdministrativo() {
  const { usuario, sair, versao } = useSessao();
  const { cores } = useTema();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [secao, setSecao] = useState<Secao>('visao');

  const metricas = useAsync(() => api.admin.metricas(), [versao], { recarregarAoFocar: true });
  const alunos = useAsync(() => api.admin.alunos(), [versao]);
  const lojas = useAsync(() => api.admin.lojas(), []);
  const operadores = useAsync(() => api.admin.operadores(), []);
  const auditoria = useAsync(() => api.admin.auditoria(), [versao]);

  const m = metricas.dados;
  const maiorPico = Math.max(1, ...(m?.horariosPico.map((h) => h.quantidade) ?? [1]));
  const maiorLoja = Math.max(1, ...(m?.porLoja.map((l) => l.totalCentavos) ?? [1]));

  return (
    <Tela estilo={{ paddingTop: insets.top + 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="legenda" suave>
            Painel administrativo
          </Texto>
          <Texto variante="subtitulo">{usuario?.nome}</Texto>
        </View>
        <Botao
          titulo="Sair"
          tipo="fantasma"
          compacto
          largura="auto"
          onPress={async () => {
            await sair();
            router.replace('/(auth)/login');
          }}
        />
      </View>

      <View style={{ paddingVertical: 16 }}>
        <Seletor<Secao>
          valor={secao}
          aoMudar={setSecao}
          opcoes={[
            { valor: 'visao', rotulo: 'Visão geral' },
            { valor: 'cadastros', rotulo: 'Cadastros' },
            { valor: 'auditoria', rotulo: 'Auditoria' },
          ]}
        />
      </View>

      {secao === 'visao' &&
        (metricas.erro ? (
          <EstadoErro mensagem={metricas.erro} aoTentarNovamente={metricas.recarregar} />
        ) : metricas.carregando || !m ? (
          <View style={{ gap: 14 }}>
            <Esqueleto altura={130} arredondamento={raio.lg} />
            <Esqueleto altura={200} arredondamento={raio.lg} />
            <Esqueleto altura={180} arredondamento={raio.lg} />
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <Superficie preenchimento={18}>
              <View style={{ gap: 8 }}>
                <Texto variante="legenda" suave>
                  Saldo em custódia
                </Texto>
                <Valor centavos={m.saldoEmCustodiaCentavos} tamanho={38} />
                <Texto variante="legenda" suave>
                  Total que o colégio guarda em nome dos {m.alunosAtivos} alunos ativos.
                </Texto>
              </View>
            </Superficie>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Metrica titulo="Volume no mês" valor={formatarReais(m.volumeMesCentavos)} />
              <Metrica titulo="Ticket médio" valor={formatarReais(m.ticketMedioCentavos)} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Metrica titulo="Transações" valor={String(m.transacoesMes)} />
              <Metrica titulo="Lojas ativas" valor={String(m.porLoja.length)} />
            </View>

            <Superficie preenchimento={16}>
              <Texto variante="subtitulo" style={{ marginBottom: 12 }}>
                Volume por loja
              </Texto>
              <View style={{ gap: 12 }}>
                {m.porLoja.map((l) => (
                  <View key={l.lojaId} style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row' }}>
                      <Texto variante="corpo" style={{ flex: 1 }}>
                        {l.nome}
                      </Texto>
                      <Texto variante="corpoForte" tabular>
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
                          borderRadius: 4,
                          width: `${Math.round((l.totalCentavos / maiorLoja) * 100)}%`,
                          backgroundColor: cores.marca,
                        }}
                      />
                    </View>
                    <Texto variante="legenda" suave>
                      {l.quantidade} transações no mês
                    </Texto>
                  </View>
                ))}
              </View>
            </Superficie>

            <Superficie preenchimento={16}>
              <Texto variante="subtitulo" style={{ marginBottom: 12 }}>
                Horários de pico
              </Texto>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 6,
                  height: 120,
                }}
              >
                {m.horariosPico.map((h) => (
                  <View key={h.hora} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                    <View
                      style={{
                        width: '100%',
                        height: Math.max(4, (h.quantidade / maiorPico) * 88),
                        borderRadius: 6,
                        backgroundColor: cores.marca,
                      }}
                    />
                    <Texto variante="micro" suave>
                      {String(h.hora).padStart(2, '0')}h
                    </Texto>
                  </View>
                ))}
              </View>
            </Superficie>

            <Superficie preenchimento={16}>
              <Texto variante="subtitulo" style={{ marginBottom: 8 }}>
                Conciliação e repasse
              </Texto>
              {m.conciliacao.map((c, i) => (
                <LinhaLista
                  key={c.lojaId}
                  primeira={i === 0}
                  titulo={c.nome}
                  descricao="Saldo acumulado a repassar"
                  esquerda={<MarcaLoja lojaId={c.lojaId} tamanho={38} />}
                  direita={
                    <Texto variante="corpoForte" tabular>
                      {formatarReais(c.aRepassarCentavos)}
                    </Texto>
                  }
                />
              ))}
              <Divisor />
              <Texto variante="legenda" suave style={{ paddingTop: 10 }}>
                Valores calculados a partir do ledger de dupla entrada. O repasse gera um
                lançamento próprio e não altera o histórico.
              </Texto>
            </Superficie>
          </View>
        ))}

      {secao === 'cadastros' && (
        <View style={{ gap: 16 }}>
          <Superficie preenchimento={16}>
            <Texto variante="subtitulo" style={{ marginBottom: 8 }}>
              Alunos
            </Texto>
            {alunos.carregando ? (
              <EsqueletoLista linhas={2} />
            ) : (
              (alunos.dados ?? []).map(({ aluno, conta }, i) => (
                <LinhaLista
                  key={aluno.id}
                  primeira={i === 0}
                  titulo={aluno.nome}
                  descricao={`${aluno.turma} · matrícula ${aluno.matricula}`}
                  direita={
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Texto variante="corpoForte" tabular>
                        {formatarReais(conta.saldoCentavos)}
                      </Texto>
                      <Selo
                        texto={conta.ativa ? 'Ativa' : 'Inativa'}
                        tom={conta.ativa ? 'sucesso' : 'alerta'}
                      />
                    </View>
                  }
                />
              ))
            )}
          </Superficie>

          <Superficie preenchimento={16}>
            <Texto variante="subtitulo" style={{ marginBottom: 8 }}>
              Lojas autorizadas
            </Texto>
            {(lojas.dados ?? []).map((l, i) => (
              <LinhaLista
                key={l.id}
                primeira={i === 0}
                titulo={l.nome}
                descricao={`${l.descricao} · ${l.abre} às ${l.fecha}`}
                esquerda={<MarcaLoja lojaId={l.id} tamanho={38} />}
                direita={<Selo texto="Autorizada" tom="sucesso" />}
              />
            ))}
            <Divisor />
            <Texto variante="legenda" suave style={{ paddingTop: 10 }}>
              Nenhum estabelecimento fora desta lista consegue receber pelo Farroups-pay.
            </Texto>
          </Superficie>

          <Superficie preenchimento={16}>
            <Texto variante="subtitulo" style={{ marginBottom: 8 }}>
              Operadores
            </Texto>
            {(operadores.dados ?? []).map((o, i) => (
              <LinhaLista
                key={o.id}
                primeira={i === 0}
                titulo={o.nome}
                descricao={o.email}
                direita={<Selo texto={o.lojaId ?? ''} />}
              />
            ))}
          </Superficie>
        </View>
      )}

      {secao === 'auditoria' && (
        <Superficie preenchimento={16}>
          <Texto variante="subtitulo" style={{ marginBottom: 8 }}>
            Log de auditoria
          </Texto>
          {auditoria.carregando ? (
            <EsqueletoLista linhas={4} />
          ) : (
            (auditoria.dados ?? []).map((a, i) => (
              <View
                key={a.id}
                style={{
                  paddingVertical: 12,
                  gap: 3,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: cores.borda,
                }}
              >
                <Texto variante="corpoForte">{a.acao}</Texto>
                <Texto variante="legenda" suave>
                  {a.autor} · {formatarDataHora(a.criadoEm)}
                </Texto>
              </View>
            ))
          )}
          <Divisor />
          <Texto variante="legenda" suave style={{ paddingTop: 10 }}>
            Registros imutáveis desde {formatarData(new Date(Date.now() - 30 * 86400000).toISOString())}.
          </Texto>
        </Superficie>
      )}
      <View style={{ height: 28 }} />
    </Tela>
  );
}

function Metrica({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Superficie preenchimento={16}>
        <View style={{ gap: 6 }}>
          <Texto variante="legenda" suave>
            {titulo}
          </Texto>
          <Texto variante="titulo" tabular>
            {valor}
          </Texto>
        </View>
      </Superficie>
    </View>
  );
}
