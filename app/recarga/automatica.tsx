import React, { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { useAsync } from '@/lib/hooks';
import { formatarReais, parseCentavos } from '@/lib/format';
import { useTema } from '@/theme';
import {
  Aviso,
  Botao,
  Cabecalho,
  Campo,
  EstadoErro,
  Esqueleto,
  LinhaLista,
  Superficie,
  Tela,
  Texto,
  useAlerta,
} from '@/ui';

export default function RecargaAutomatica() {
  const { conta } = useLocalSearchParams<{ conta: string }>();
  const { usuario, alunoAtivoId, invalidar, versao } = useSessao();
  const { cores } = useTema();
  const { avisar } = useAlerta();
  const router = useRouter();

  const alunoId = alunoAtivoId ?? usuario?.alunoId ?? '';
  const estado = useAsync(() => api.carteira.resumo(alunoId), [alunoId, versao]);

  const [ativa, setAtiva] = useState(false);
  const [gatilho, setGatilho] = useState('20,00');
  const [valor, setValor] = useState('50,00');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const config = estado.dados?.conta.recargaAutomatica;
    if (config) {
      setAtiva(config.ativa);
      setGatilho((config.gatilhoCentavos / 100).toFixed(2).replace('.', ','));
      setValor((config.valorCentavos / 100).toFixed(2).replace('.', ','));
    }
  }, [estado.dados?.conta.id]);

  async function salvar() {
    setSalvando(true);
    try {
      await api.recargas.configurarAutomatica(String(conta || estado.dados?.conta.id), {
        ativa,
        gatilhoCentavos: parseCentavos(gatilho),
        valorCentavos: parseCentavos(valor),
      });
      invalidar();
      avisar(ativa ? 'Recarga automática ativada.' : 'Recarga automática desativada.', 'sucesso');
      router.back();
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Não foi possível salvar.', 'erro');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Tela
      aoFinal={<Botao titulo="Salvar" carregando={salvando} onPress={() => void salvar()} />}
    >
      <Cabecalho
        titulo="Recarga automática"
        subtitulo="Para o saldo não acabar no meio do recreio."
      />

      {estado.erro ? (
        <EstadoErro mensagem={estado.erro} aoTentarNovamente={estado.recarregar} />
      ) : estado.carregando ? (
        <Esqueleto altura={180} arredondamento={16} />
      ) : (
        <View style={{ gap: 16 }}>
          <Superficie preenchimento={16}>
            <LinhaLista
              primeira
              titulo="Ativar recarga automática"
              descricao="Cobrança no Pix cadastrado do responsável"
              direita={
                <Switch
                  value={ativa}
                  onValueChange={setAtiva}
                  trackColor={{ true: cores.marca, false: cores.superficieToque }}
                  accessibilityLabel="Ativar recarga automática"
                />
              }
            />
          </Superficie>

          <Superficie preenchimento={16}>
            <View style={{ gap: 14, opacity: ativa ? 1 : 0.5 }}>
              <Campo
                rotulo="Quando o saldo ficar abaixo de"
                keyboardType="number-pad"
                value={gatilho}
                onChangeText={setGatilho}
                editable={ativa}
                auxiliar={`Hoje: ${formatarReais(parseCentavos(gatilho))}`}
              />
              <Campo
                rotulo="Recarregar automaticamente"
                keyboardType="number-pad"
                value={valor}
                onChangeText={setValor}
                editable={ativa}
                auxiliar={`Hoje: ${formatarReais(parseCentavos(valor))}`}
              />
            </View>
          </Superficie>

          <Aviso
            icone="sino"
            texto="Toda recarga automática gera notificação para o responsável e aparece no extrato."
          />
          <Texto variante="legenda" suave>
            O saldo nunca fica negativo: se a recarga falhar, a compra é apenas recusada.
          </Texto>
        </View>
      )}
      <View style={{ height: 16 }} />
    </Tela>
  );
}
