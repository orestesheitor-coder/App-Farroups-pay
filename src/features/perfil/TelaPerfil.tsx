import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { useAsync } from '@/lib/hooks';
import { formatarDataHora, iniciais } from '@/lib/format';
import { raio, useTema, type PreferenciaTema } from '@/theme';
import {
  Aviso,
  Botao,
  Divisor,
  EsqueletoLista,
  Folha,
  LinhaLista,
  Seletor,
  Superficie,
  Tela,
  Texto,
  useAlerta,
} from '@/ui';

export function TelaPerfil({ vincularAluno }: { vincularAluno?: boolean }) {
  const { usuario, sair, atualizarUsuario } = useSessao();
  const { cores, preferencia, definirPreferencia } = useTema();
  const { avisar } = useAlerta();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [privacidade, setPrivacidade] = useState(false);

  const dispositivos = useAsync(
    async () => (usuario ? api.auth.dispositivos(usuario.id) : []),
    [usuario?.id],
  );

  async function alternarBiometria(valor: boolean) {
    if (!usuario) return;
    if (valor) {
      const tem = await LocalAuthentication.hasHardwareAsync();
      const cadastrada = tem && (await LocalAuthentication.isEnrolledAsync());
      if (!cadastrada) {
        avisar('Cadastre uma biometria no seu aparelho primeiro.', 'erro');
        return;
      }
      const r = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirme para ativar a biometria',
      });
      if (!r.success) return;
    }
    atualizarUsuario(await api.auth.ativarBiometria(usuario.id, valor));
    avisar(valor ? 'Biometria ativada.' : 'Biometria desativada.', 'sucesso');
  }

  if (!usuario) return null;

  return (
    <Tela estilo={{ paddingTop: insets.top + 8 }}>
      <View style={{ paddingVertical: 12, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: raio.pill,
              backgroundColor: cores.marcaSuave,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Texto variante="subtitulo" cor={cores.marca}>
              {iniciais(usuario.nome)}
            </Texto>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Texto variante="titulo">{usuario.nome}</Texto>
            <Texto variante="legenda" suave>
              {usuario.email}
            </Texto>
          </View>
        </View>
      </View>

      <View style={{ gap: 16 }}>
        <Superficie preenchimento={16}>
          <Texto variante="legenda" peso="600" suave style={{ marginBottom: 10 }}>
            APARÊNCIA
          </Texto>
          <Seletor<PreferenciaTema>
            valor={preferencia}
            aoMudar={definirPreferencia}
            opcoes={[
              { valor: 'sistema', rotulo: 'Sistema' },
              { valor: 'claro', rotulo: 'Claro' },
              { valor: 'escuro', rotulo: 'Escuro' },
            ]}
          />
        </Superficie>

        <Superficie preenchimento={16}>
          <Texto variante="legenda" peso="600" suave style={{ marginBottom: 4 }}>
            SEGURANÇA
          </Texto>
          <LinhaLista
            primeira
            titulo="Entrar com biometria"
            descricao="Usa Face ID ou digital do próprio aparelho"
            direita={
              <Switch
                value={usuario.biometriaAtiva}
                onValueChange={(v) => void alternarBiometria(v)}
                trackColor={{ true: cores.marca, false: cores.superficieToque }}
                accessibilityLabel="Entrar com biometria"
              />
            }
          />
          <LinhaLista
            titulo="Alterar PIN"
            descricao="Autoriza compras acima de R$ 50,00"
            onPress={() => router.push('/(auth)/pin')}
          />
          <LinhaLista
            titulo="Notificações"
            descricao="Escolha quando o app deve avisar"
            onPress={() => router.push('/notificacoes')}
          />
        </Superficie>

        <Superficie preenchimento={16}>
          <Texto variante="legenda" peso="600" suave style={{ marginBottom: 4 }}>
            DISPOSITIVOS CONECTADOS
          </Texto>
          {dispositivos.carregando ? (
            <EsqueletoLista linhas={2} />
          ) : (
            (dispositivos.dados ?? []).map((d, i) => (
              <LinhaLista
                key={d.id}
                primeira={i === 0}
                titulo={d.nome}
                descricao={`Último acesso em ${formatarDataHora(d.ultimoAcesso)}`}
                direita={
                  d.atual ? (
                    <Texto variante="legenda" suave>
                      Atual
                    </Texto>
                  ) : (
                    <Botao
                      titulo="Encerrar"
                      tipo="perigo"
                      compacto
                      largura="auto"
                      onPress={async () => {
                        await api.auth.encerrarDispositivo(d.id);
                        dispositivos.recarregar();
                        avisar('Sessão encerrada nesse dispositivo.', 'sucesso');
                      }}
                    />
                  )
                }
              />
            ))
          )}
        </Superficie>

        <Superficie preenchimento={16}>
          <LinhaLista
            primeira
            titulo="Privacidade e LGPD"
            descricao="Como tratamos os dados de estudantes"
            onPress={() => setPrivacidade(true)}
          />
          {vincularAluno && (
            <LinhaLista
              titulo="Vincular outro aluno"
              descricao="Com o código enviado pela secretaria"
              onPress={() => router.push('/(auth)/vincular')}
            />
          )}
          <LinhaLista
            titulo="Reembolso de saldo"
            descricao="Solicitação presencial na secretaria"
            onPress={() =>
              avisar('Reembolsos são tratados pela secretaria, com o responsável.', 'neutro')
            }
          />
          <LinhaLista
            titulo="Recomeçar demonstração"
            descricao="Restaura saldos, limites e histórico de exemplo"
            onPress={async () => {
              await api.reiniciarDemo?.();
              await sair();
              router.replace('/(auth)/login');
            }}
          />
        </Superficie>

        <Botao
          titulo="Sair da conta"
          tipo="perigo"
          icone="sair"
          onPress={async () => {
            await sair();
            router.replace('/(auth)/login');
          }}
        />
        <Texto variante="legenda" suave centro>
          Farroups-pay · versão 1.0.0
        </Texto>
      </View>

      <Folha
        visivel={privacidade}
        aoFechar={() => setPrivacidade(false)}
        titulo="Privacidade e LGPD"
        subtitulo="Resumo em linguagem simples da política do colégio."
      >
        <View style={{ gap: 12 }}>
          <Texto variante="corpo">
            Guardamos apenas o necessário para operar a carteira: matrícula, turma, saldo e
            histórico de transações dentro do colégio.
          </Texto>
          <Texto variante="corpo">
            O responsável autoriza o uso da conta pelo estudante e pode revogar o acesso a
            qualquer momento junto à secretaria.
          </Texto>
          <Texto variante="corpo">
            Não vendemos dados, não fazemos perfilamento publicitário e não compartilhamos
            informações com terceiros fora da operação de pagamento.
          </Texto>
          <Divisor />
          <Aviso
            icone="escudo"
            texto="Senha e PIN são guardados como hash. Dados de cartão de crédito ficam com o gateway certificado PCI-DSS, nunca no app."
          />
          <Botao titulo="Entendi" onPress={() => setPrivacidade(false)} />
        </View>
      </Folha>
      <View style={{ height: 24 }} />
    </Tela>
  );
}
