import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessao } from '@/state/sessao';
import { useTema } from '@/theme';
import {
  Aviso,
  Botao,
  Campo,
  Divisor,
  Icone,
  Selo,
  Tela,
  Texto,
  useAlerta,
} from '@/ui';
import { MarcaFarroups } from '@/features/comum/MarcaFarroups';

const DEMO = [
  { rotulo: 'Aluna', login: 'helena@farroupilha.br', descricao: 'Helena · 8º ano A' },
  { rotulo: 'Responsável', login: 'camila@farroupilha.br', descricao: 'Camila · 2 alunos' },
  { rotulo: 'Lojista', login: 'ze@barodoze.com.br', descricao: 'Bar do Zé' },
  { rotulo: 'Colégio', login: 'secretaria@farroupilha.br', descricao: 'Painel administrativo' },
];

export default function Login() {
  const { entrar } = useSessao();
  const { cores } = useTema();
  const { avisar } = useAlerta();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [temBiometria, setTemBiometria] = useState(false);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync()
      .then(async (tem) => setTemBiometria(tem && (await LocalAuthentication.isEnrolledAsync())))
      .catch(() => setTemBiometria(false));
  }, []);

  async function acessar(usuario = login, chave = senha) {
    setErro(null);
    setEnviando(true);
    try {
      await entrar(usuario, chave);
      router.replace('/');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar agora.');
    } finally {
      setEnviando(false);
    }
  }

  async function acessarComBiometria() {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Entrar no Farroups-pay',
      cancelLabel: 'Usar senha',
    });
    if (r.success) {
      await acessar('helena@farroupilha.br', 'farroupilha');
    } else {
      avisar('Não foi possível confirmar sua biometria.', 'erro');
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Tela estilo={{ paddingTop: insets.top + 24 }}>
        <View style={{ gap: 14, marginBottom: 28 }}>
          <MarcaFarroups tamanho={52} />
          <View style={{ gap: 6 }}>
            <Texto variante="displayGrande">Farroups-pay</Texto>
            <Texto variante="corpo" suave>
              A carteira do Colégio Farroupilha. Saldo, cartão e extrato em um lugar só.
            </Texto>
          </View>
        </View>

        <View style={{ gap: 14 }}>
          <Campo
            rotulo="Matrícula ou e-mail institucional"
            placeholder="2026081"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={login}
            onChangeText={setLogin}
            icone="escola"
          />
          <Campo
            rotulo="Senha"
            placeholder="Sua senha"
            segredo
            value={senha}
            onChangeText={setSenha}
            icone="cadeado"
            erro={erro}
            onSubmitEditing={() => void acessar()}
          />
          <Botao
            titulo="Entrar"
            carregando={enviando}
            disabled={!login || !senha}
            onPress={() => void acessar()}
          />
          {temBiometria && (
            <Botao
              titulo="Entrar com biometria"
              tipo="fantasma"
              icone="escudo"
              onPress={() => void acessarComBiometria()}
            />
          )}
        </View>

        <View style={{ marginVertical: 26, gap: 14 }}>
          <Divisor />
          <Texto variante="legenda" peso="600" suave>
            Acessos de demonstração · senha farroupilha
          </Texto>
          <View style={{ gap: 8 }}>
            {DEMO.map((d) => (
              <Pressable
                key={d.login}
                accessibilityRole="button"
                accessibilityLabel={`Entrar como ${d.rotulo}`}
                onPress={() => {
                  setLogin(d.login);
                  setSenha('farroupilha');
                  void acessar(d.login, 'farroupilha');
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 56,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: cores.borda,
                  backgroundColor: pressed ? cores.superficieToque : cores.superficie,
                })}
              >
                <View style={{ flex: 1, gap: 3 }}>
                  <Texto variante="corpoForte">{d.rotulo}</Texto>
                  <Texto variante="legenda" suave>
                    {d.descricao}
                  </Texto>
                </View>
                <Selo texto="Entrar" tom="marca" />
                <Icone nome="setaDireita" tamanho={16} cor={cores.textoSuave} />
              </Pressable>
            ))}
          </View>
        </View>

        <Aviso
          icone="escudo"
          texto="Dados de estudantes são tratados conforme a LGPD. Coletamos o mínimo necessário e o responsável autoriza o uso da conta."
        />
      </Tela>
    </KeyboardAvoidingView>
  );
}
