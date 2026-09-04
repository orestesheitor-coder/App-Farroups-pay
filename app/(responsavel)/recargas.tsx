import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { useAsync } from '@/lib/hooks';
import { rotuloDoDia } from '@/lib/format';
import { useTema } from '@/theme';
import {
  EstadoErro,
  EstadoVazio,
  EsqueletoLista,
  Superficie,
  Tela,
  Texto,
  Valor,
} from '@/ui';
import { LinhaTransacao } from '@/features/carteira/LinhaTransacao';

export default function HistoricoRecargas() {
  const { usuario, versao } = useSessao();
  const { cores } = useTema();
  const insets = useSafeAreaInsets();

  const alunos = useAsync(
    async () => (usuario ? api.responsavel.alunos(usuario.id) : []),
    [usuario?.id, versao],
  );

  const recargas = useAsync(
    async () =>
      alunos.dados ? api.recargas.historico(alunos.dados.map((a) => a.aluno.id)) : [],
    [alunos.dados, versao],
    { recarregarAoFocar: true },
  );

  const totalMes = (recargas.dados ?? [])
    .filter((t) => new Date(t.criadaEm).getMonth() === new Date().getMonth())
    .reduce((s, t) => s + t.valorCentavos, 0);

  return (
    <Tela estilo={{ paddingTop: insets.top + 8 }}>
      <View style={{ paddingVertical: 12, gap: 6 }}>
        <Texto variante="display">Recargas</Texto>
        <Texto variante="legenda" suave>
          Tudo que você adicionou nas contas dos alunos.
        </Texto>
      </View>

      <View style={{ gap: 16 }}>
        <Superficie preenchimento={18}>
          <View style={{ gap: 6 }}>
            <Texto variante="legenda" suave>
              Recarregado neste mês
            </Texto>
            <Valor centavos={totalMes} tamanho={34} cor={cores.sucesso} />
          </View>
        </Superficie>

        <Superficie preenchimento={16}>
          <Texto variante="legenda" peso="600" suave style={{ marginBottom: 6 }}>
            HISTÓRICO
          </Texto>
          {recargas.erro ? (
            <EstadoErro mensagem={recargas.erro} aoTentarNovamente={recargas.recarregar} />
          ) : recargas.carregando || alunos.carregando ? (
            <EsqueletoLista linhas={4} />
          ) : (recargas.dados ?? []).length === 0 ? (
            <EstadoVazio
              icone="carteira"
              titulo="Nenhuma recarga ainda"
              descricao="As recargas por Pix e cartão aparecem aqui com o recibo."
            />
          ) : (
            (recargas.dados ?? []).map((t) => (
              <LinhaTransacao key={t.id} transacao={t} mostrarData={rotuloDoDia(t.criadaEm)} />
            ))
          )}
        </Superficie>

        <Texto variante="legenda" suave>
          Reembolso de saldo não utilizado é solicitado na secretaria, com o responsável
          presente. O valor não volta para o app.
        </Texto>
      </View>
      <View style={{ height: 24 }} />
    </Tela>
  );
}
