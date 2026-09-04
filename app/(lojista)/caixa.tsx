import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { useAsync } from '@/lib/hooks';
import { LOJAS } from '@/services/mock/seed';
import { formatarData, formatarHora, formatarReais } from '@/lib/format';
import { raio } from '@/theme';
import {
  Aviso,
  Botao,
  EstadoErro,
  Esqueleto,
  Superficie,
  Tela,
  Texto,
  Valor,
  useAlerta,
} from '@/ui';

export default function Caixa() {
  const { usuario, versao, sair } = useSessao();
  const { avisar } = useAlerta();
  const insets = useSafeAreaInsets();

  const loja = LOJAS.find((l) => l.id === usuario?.lojaId);
  const estado = useAsync(
    async () => (loja ? api.lojista.fechamento(loja.id) : null),
    [loja?.id, versao],
    { recarregarAoFocar: true },
  );
  const f = estado.dados;

  return (
    <Tela estilo={{ paddingTop: insets.top + 8 }}>
      <View style={{ paddingVertical: 12, gap: 6 }}>
        <Texto variante="display">Fechamento</Texto>
        <Texto variante="legenda" suave>
          {loja?.nome} · {formatarData(new Date().toISOString())}
        </Texto>
      </View>

      {estado.erro ? (
        <EstadoErro mensagem={estado.erro} aoTentarNovamente={estado.recarregar} />
      ) : estado.carregando || !f ? (
        <View style={{ gap: 14 }}>
          <Esqueleto altura={120} arredondamento={raio.lg} />
          <Esqueleto altura={180} arredondamento={raio.lg} />
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Superficie preenchimento={18}>
            <View style={{ gap: 8 }}>
              <Texto variante="legenda" suave>
                Vendas do turno
              </Texto>
              <Valor centavos={f.totalCentavos} tamanho={38} />
              <Texto variante="legenda" suave>
                {f.quantidade} transações · aberto desde {formatarHora(f.abertura)}
              </Texto>
            </View>
          </Superficie>

          <Superficie preenchimento={16}>
            <View style={{ gap: 14 }}>
              <Linha rotulo="Ticket médio" valor={formatarReais(f.ticketMedioCentavos)} />
              <Linha rotulo="Estornos" valor={formatarReais(f.estornosCentavos)} />
              <Linha
                rotulo="Líquido a repassar"
                valor={formatarReais(f.totalCentavos - f.estornosCentavos)}
                destaque
              />
            </View>
          </Superficie>

          <Aviso
            icone="relogio"
            texto="O repasse ao lojista é conciliado pelo colégio no dia útil seguinte, com base neste fechamento."
          />

          <Botao
            titulo="Fechar caixa do turno"
            onPress={() =>
              avisar(
                `Turno fechado com ${formatarReais(f.totalCentavos)} em ${f.quantidade} vendas.`,
                'sucesso',
              )
            }
          />
          <Botao titulo="Sair da conta" tipo="perigo" icone="sair" onPress={() => void sair()} />
        </View>
      )}
      <View style={{ height: 24 }} />
    </Tela>
  );
}

function Linha({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Texto variante={destaque ? 'corpoForte' : 'corpo'} suave={!destaque} style={{ flex: 1 }}>
        {rotulo}
      </Texto>
      <Texto variante={destaque ? 'subtitulo' : 'corpoForte'} tabular>
        {valor}
      </Texto>
    </View>
  );
}
