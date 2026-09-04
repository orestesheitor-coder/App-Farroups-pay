import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { Aviso, Botao, Campo, Cabecalho, Tela, Texto, useAlerta } from '@/ui';

export default function VincularAluno() {
  const { usuario } = useSessao();
  const { avisar } = useAlerta();
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function vincular() {
    if (!usuario) return;
    setEnviando(true);
    setErro(null);
    try {
      const aluno = await api.auth.vincularAluno(usuario.id, codigo);
      avisar(`${aluno.nome.split(' ')[0]} vinculado à sua conta.`, 'sucesso');
      router.back();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível vincular agora.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <Cabecalho
        titulo="Vincular aluno"
        subtitulo="Use o código que a secretaria enviou no comunicado da turma."
      />
      <View style={{ gap: 16 }}>
        <Campo
          rotulo="Código de vínculo"
          placeholder="8ANO-HELENA"
          autoCapitalize="characters"
          autoCorrect={false}
          value={codigo}
          onChangeText={setCodigo}
          erro={erro}
          icone="escola"
        />
        <Botao
          titulo="Vincular"
          carregando={enviando}
          disabled={codigo.trim().length < 4}
          onPress={() => void vincular()}
        />
        <Aviso
          icone="escudo"
          texto="O vínculo dá acesso a saldo, limites e extrato do aluno. Só a secretaria emite novos códigos."
        />
        <Texto variante="legenda" suave>
          Códigos de demonstração: 8ANO-HELENA e 5ANO-BENTO.
        </Texto>
      </View>
    </Tela>
  );
}
