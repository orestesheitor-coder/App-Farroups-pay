import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { useTema } from '@/theme';
import {
  Aviso,
  PontosPin,
  Seletor,
  Tela,
  TecladoNumerico,
  Texto,
  useAlerta,
} from '@/ui';

export default function CriarPin() {
  const { usuario, atualizarUsuario } = useSessao();
  const { cores } = useTema();
  const { avisar } = useAlerta();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [tamanho, setTamanho] = useState<'4' | '6'>('4');
  const [etapa, setEtapa] = useState<'definir' | 'confirmar'>('definir');
  const [primeiro, setPrimeiro] = useState('');
  const [atual, setAtual] = useState('');
  const [erro, setErro] = useState(false);

  const digitos = Number(tamanho);

  function digitar(d: string) {
    if (d === ',') return;
    setErro(false);
    const proximo = (atual + d).slice(0, digitos);
    setAtual(proximo);
    if (proximo.length === digitos) {
      setTimeout(() => concluir(proximo), 160);
    }
  }

  async function concluir(valor: string) {
    if (etapa === 'definir') {
      setPrimeiro(valor);
      setAtual('');
      setEtapa('confirmar');
      return;
    }
    if (valor !== primeiro) {
      setErro(true);
      setAtual('');
      avisar('Os PINs não são iguais. Tente de novo.', 'erro');
      return;
    }
    if (!usuario) return;
    try {
      await api.auth.definirPin(usuario.id, valor);
      atualizarUsuario({ ...usuario, temPin: true });
      avisar('PIN criado. Ele autoriza compras acima de R$ 50,00.', 'sucesso');
      router.replace('/');
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Não foi possível salvar o PIN.', 'erro');
      setAtual('');
    }
  }

  return (
    <Tela rolagem={false} estilo={{ paddingTop: insets.top + 20, flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingBottom: 16 }}>
        <View style={{ gap: 22 }}>
          <View style={{ gap: 8 }}>
            <Texto variante="display">
              {etapa === 'definir' ? 'Crie seu PIN' : 'Confirme o PIN'}
            </Texto>
            <Texto variante="corpo" suave>
              {etapa === 'definir'
                ? 'Ele autoriza compras acima de R$ 50,00 e ações sensíveis na conta.'
                : 'Digite os mesmos dígitos mais uma vez.'}
            </Texto>
          </View>

          {etapa === 'definir' && (
            <Seletor
              valor={tamanho}
              aoMudar={(v) => {
                setTamanho(v);
                setAtual('');
              }}
              opcoes={[
                { valor: '4', rotulo: '4 dígitos' },
                { valor: '6', rotulo: '6 dígitos' },
              ]}
            />
          )}

          <View style={{ paddingVertical: 18 }}>
            <PontosPin tamanho={digitos} preenchidos={atual.length} erro={erro} />
          </View>

          <Aviso
            icone="escudo"
            texto="O PIN não é guardado em texto puro: o app envia apenas um hash ao servidor."
          />
        </View>

        <View>
          <TecladoNumerico
            mostrarVirgula={false}
            aoDigitar={digitar}
            aoApagar={() => setAtual((a) => a.slice(0, -1))}
          />
          <Texto variante="legenda" suave centro style={{ color: cores.textoSuave }}>
            {etapa === 'confirmar' ? 'Precisa recomeçar? Toque em apagar até zerar.' : ' '}
          </Texto>
        </View>
      </View>
    </Tela>
  );
}
