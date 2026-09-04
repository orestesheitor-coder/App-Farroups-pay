import React, { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { useAsync } from '@/lib/hooks';
import { formatarReais, parseCentavos } from '@/lib/format';
import { LOJAS } from '@/services/mock/seed';
import type { LojaId } from '@/domain/types';
import { raio, useTema } from '@/theme';
import {
  Aviso,
  Botao,
  Cabecalho,
  Campo,
  EstadoErro,
  EstadoVazio,
  Esqueleto,
  LinhaLista,
  MarcaLoja,
  Pilula,
  Superficie,
  Tela,
  Texto,
  useAlerta,
} from '@/ui';
import { LinhaTransacao } from '@/features/carteira/LinhaTransacao';

const SUGESTOES_DIARIO = [2000, 3000, 5000, 8000];

export default function AjustesDoAluno() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { invalidar, versao } = useSessao();
  const { cores } = useTema();
  const { avisar } = useAlerta();
  const router = useRouter();

  const resumo = useAsync(() => api.carteira.resumo(String(id)), [id, versao], {
    recarregarAoFocar: true,
  });
  const conta = resumo.dados?.conta;

  const [diario, setDiario] = useState('');
  const [porCompra, setPorCompra] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (conta) {
      setDiario((conta.limites.diarioCentavos / 100).toFixed(2).replace('.', ','));
      setPorCompra((conta.limites.porTransacaoCentavos / 100).toFixed(2).replace('.', ','));
    }
  }, [conta?.id]);

  async function salvarLimites(novos?: { diarioCentavos?: number }) {
    if (!conta) return;
    setSalvando(true);
    try {
      const atualizada = await api.responsavel.definirLimites(conta.id, {
        ...conta.limites,
        diarioCentavos: novos?.diarioCentavos ?? parseCentavos(diario),
        porTransacaoCentavos: parseCentavos(porCompra),
      });
      setDiario((atualizada.limites.diarioCentavos / 100).toFixed(2).replace('.', ','));
      invalidar();
      resumo.recarregar();
      avisar('Limites atualizados.', 'sucesso');
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Não foi possível salvar.', 'erro');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarLoja(lojaId: LojaId, bloquear: boolean) {
    if (!conta) return;
    await api.responsavel.bloquearLoja(conta.id, lojaId, bloquear);
    invalidar();
    resumo.recarregar();
    avisar(
      bloquear
        ? `${LOJAS.find((l) => l.id === lojaId)?.nome} bloqueada para este aluno.`
        : 'Loja liberada.',
      bloquear ? 'neutro' : 'sucesso',
    );
  }

  return (
    <Tela>
      <Cabecalho
        titulo={resumo.dados ? resumo.dados.aluno.nome.split(' ')[0] : 'Aluno'}
        subtitulo={resumo.dados ? `${resumo.dados.aluno.turma} · saldo ${formatarReais(resumo.dados.conta.saldoCentavos)}` : undefined}
      />

      {resumo.erro ? (
        <EstadoErro mensagem={resumo.erro} aoTentarNovamente={resumo.recarregar} />
      ) : resumo.carregando || !conta || !resumo.dados ? (
        <View style={{ gap: 14 }}>
          <Esqueleto altura={150} arredondamento={raio.lg} />
          <Esqueleto altura={190} arredondamento={raio.lg} />
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Superficie preenchimento={16}>
            <View style={{ gap: 14 }}>
              <Texto variante="legenda" peso="600" suave>
                LIMITES
              </Texto>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {SUGESTOES_DIARIO.map((v) => (
                  <Pilula
                    key={v}
                    titulo={formatarReais(v).replace(',00', '')}
                    ativa={conta.limites.diarioCentavos === v}
                    onPress={() => void salvarLimites({ diarioCentavos: v })}
                  />
                ))}
              </View>
              <Campo
                rotulo="Limite diário"
                keyboardType="number-pad"
                value={diario}
                onChangeText={setDiario}
                auxiliar={`Gasto hoje: ${formatarReais(resumo.dados.gastoNoDiaCentavos)} · zera à meia-noite`}
              />
              <Campo
                rotulo="Limite por compra"
                keyboardType="number-pad"
                value={porCompra}
                onChangeText={setPorCompra}
                auxiliar="Recusa compras isoladas acima deste valor"
              />
              <Botao
                titulo="Salvar limites"
                carregando={salvando}
                onPress={() => void salvarLimites()}
              />
            </View>
          </Superficie>

          <Superficie preenchimento={16}>
            <Texto variante="legenda" peso="600" suave style={{ marginBottom: 4 }}>
              LOJAS PERMITIDAS
            </Texto>
            {LOJAS.map((loja, i) => {
              const bloqueada = conta.limites.lojasBloqueadas.includes(loja.id);
              return (
                <LinhaLista
                  key={loja.id}
                  primeira={i === 0}
                  titulo={loja.nome}
                  descricao={bloqueada ? 'Bloqueada para este aluno' : loja.descricao}
                  esquerda={<MarcaLoja lojaId={loja.id} tamanho={38} />}
                  direita={
                    <Switch
                      value={!bloqueada}
                      onValueChange={(v) => void alternarLoja(loja.id, !v)}
                      trackColor={{ true: cores.marca, false: cores.superficieToque }}
                      accessibilityLabel={`Permitir compras no ${loja.nome}`}
                    />
                  }
                />
              );
            })}
          </Superficie>

          <Superficie preenchimento={16}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Texto variante="legenda" peso="600" suave style={{ flex: 1 }}>
                ÚLTIMAS TRANSAÇÕES
              </Texto>
            </View>
            {resumo.dados.ultimas.length === 0 ? (
              <EstadoVazio
                titulo="Sem movimentações"
                descricao="As compras aparecem aqui assim que acontecerem."
              />
            ) : (
              resumo.dados.ultimas.map((t) => <LinhaTransacao key={t.id} transacao={t} />)
            )}
          </Superficie>

          <Botao
            titulo="Adicionar saldo"
            icone="mais"
            onPress={() => router.push('/recarga')}
          />
          <Aviso
            icone="escudo"
            texto="Limites e bloqueios valem imediatamente, inclusive para compras em andamento na maquininha."
          />
        </View>
      )}
      <View style={{ height: 24 }} />
    </Tela>
  );
}
