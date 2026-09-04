import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '@/services';
import { useAsync } from '@/lib/hooks';
import { useSessao } from '@/state/sessao';
import { formatarReais } from '@/lib/format';
import { raio, useTema } from '@/theme';
import { Botao, CheckAnimado, Esqueleto, Tela, Texto, Valor } from '@/ui';

export default function RecargaConcluida() {
  const { valor, conta, metodo } = useLocalSearchParams<{
    valor: string;
    conta: string;
    metodo: string;
  }>();
  const { cores } = useTema();
  const { alunoAtivoId, usuario, versao } = useSessao();
  const router = useRouter();

  const alunoId = alunoAtivoId ?? usuario?.alunoId ?? '';
  const resumo = useAsync(() => api.carteira.resumo(alunoId), [alunoId, versao]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  return (
    <Tela
      rolagem={false}
      estilo={{ flex: 1 }}
      aoFinal={
        <View style={{ gap: 10 }}>
          <Botao titulo="Voltar para a carteira" onPress={() => router.replace('/(aluno)')} />
          <Botao
            titulo="Ver extrato"
            tipo="fantasma"
            onPress={() => router.replace('/(aluno)/extrato')}
          />
        </View>
      }
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <CheckAnimado cor={cores.sucesso} fundo={cores.sucessoSuave} />
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Texto variante="titulo">Saldo adicionado</Texto>
          <Texto variante="legenda" suave>
            {metodo ?? 'Pix'} · {formatarReais(Number(valor ?? 0))}
          </Texto>
        </View>
        <View style={{ alignItems: 'center', gap: 4, paddingTop: 8 }}>
          <Texto variante="legenda" suave>
            Novo saldo
          </Texto>
          {resumo.carregando || !resumo.dados ? (
            <Esqueleto altura={40} largura={160} arredondamento={raio.sm} />
          ) : (
            <Valor centavos={resumo.dados.conta.saldoCentavos} tamanho={38} />
          )}
        </View>
      </View>
    </Tela>
  );
}
