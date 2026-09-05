import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { api } from '@/services';
import type { SolicitacaoConta } from '@/domain/types';
import { NOME_SEGMENTO, segmentoDaTurma, useTema } from '@/theme';
import {
  Aviso,
  Botao,
  Cabecalho,
  Campo,
  Divisor,
  Selo,
  Superficie,
  Tela,
  Texto,
  useAlerta,
} from '@/ui';
import { SeloFarroupilha } from '@/features/comum/MarcaFarroups';

/**
 * Pedido de abertura de conta. Quem preenche é o responsável; quem cria as
 * contas é a secretaria, depois de conferir a matrícula. Este formulário só
 * enfileira o pedido — nada é criado aqui.
 */
export default function SolicitarConta() {
  const { cores } = useTema();
  const { avisar } = useAlerta();
  const router = useRouter();

  const [nomeResp, setNomeResp] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nomeAluno, setNomeAluno] = useState('');
  const [matricula, setMatricula] = useState('');
  const [turma, setTurma] = useState('');
  const [consentimento, setConsentimento] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviada, setEnviada] = useState<SolicitacaoConta | null>(null);

  const segmento = turma.trim() ? segmentoDaTurma(turma) : null;
  const completo =
    nomeResp.trim().length > 4 &&
    cpf.replace(/\D/g, '').length === 11 &&
    /\S+@\S+\.\S+/.test(email) &&
    telefone.replace(/\D/g, '').length >= 10 &&
    nomeAluno.trim().length > 4 &&
    matricula.trim().length >= 5 &&
    turma.trim().length >= 4 &&
    consentimento;

  async function enviar() {
    setEnviando(true);
    setErro(null);
    try {
      const solicitacao = await api.solicitacoes.criar({
        responsavel: {
          nome: nomeResp.trim(),
          cpf: cpf.trim(),
          email: email.trim(),
          telefone: telefone.trim(),
        },
        aluno: {
          nome: nomeAluno.trim(),
          matricula: matricula.trim(),
          turma: turma.trim(),
          segmento: segmentoDaTurma(turma),
        },
        consentimentoLgpd: consentimento,
      });
      setEnviada(solicitacao);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível enviar agora.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviada) {
    return (
      <Tela>
        <Cabecalho titulo="Pedido enviado" voltar={false} />
        <View style={{ alignItems: 'center', gap: 16, paddingVertical: 20 }}>
          <SeloFarroupilha tamanho={56} cor={cores.marca} />
          <Texto variante="corpo" centro style={{ maxWidth: 300 }}>
            A secretaria vai conferir os dados contra a matrícula e abrir as contas.
            Você recebe um e-mail em {esconderEmail(enviada.responsavel.email)} quando
            estiver pronto.
          </Texto>
          <Superficie preenchimento={18} style={{ width: '100%' }}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Texto variante="micro" suave>
                PROTOCOLO
              </Texto>
              <Texto variante="display" tabular>
                {enviada.id}
              </Texto>
              <Botao
                titulo="Copiar protocolo"
                tipo="secundario"
                icone="copiar"
                compacto
                largura="auto"
                onPress={async () => {
                  await Clipboard.setStringAsync(enviada.id);
                  avisar('Protocolo copiado.', 'sucesso');
                }}
              />
            </View>
          </Superficie>
          <Aviso
            icone="relogio"
            texto="A análise costuma levar até dois dias úteis. Guarde o protocolo para acompanhar na secretaria."
          />
          <Botao titulo="Voltar ao início" onPress={() => router.replace('/(auth)/login')} />
        </View>
      </Tela>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Tela>
        <Cabecalho
          titulo="Solicitar conta"
          subtitulo="O responsável envia o pedido; a secretaria confere a matrícula e abre as contas."
        />

        <View style={{ gap: 18 }}>
          <Superficie preenchimento={16}>
            <View style={{ gap: 14 }}>
              <Texto variante="micro" suave>
                RESPONSÁVEL FINANCEIRO
              </Texto>
              <Campo
                rotulo="Nome completo"
                placeholder="Como consta no documento"
                value={nomeResp}
                onChangeText={setNomeResp}
                icone="perfil"
              />
              <Campo
                rotulo="CPF"
                placeholder="000.000.000-00"
                keyboardType="number-pad"
                value={cpf}
                onChangeText={(v) => setCpf(mascaraCpf(v))}
              />
              <Campo
                rotulo="E-mail"
                placeholder="para receber o acesso"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <Campo
                rotulo="Telefone"
                placeholder="(51) 90000-0000"
                keyboardType="phone-pad"
                value={telefone}
                onChangeText={(v) => setTelefone(mascaraTelefone(v))}
              />
            </View>
          </Superficie>

          <Superficie preenchimento={16}>
            <View style={{ gap: 14 }}>
              <Texto variante="micro" suave>
                ESTUDANTE
              </Texto>
              <Campo
                rotulo="Nome completo"
                placeholder="Como consta na matrícula"
                value={nomeAluno}
                onChangeText={setNomeAluno}
                icone="escola"
              />
              <Campo
                rotulo="Matrícula"
                placeholder="2026000"
                keyboardType="number-pad"
                value={matricula}
                onChangeText={(v) => setMatricula(v.replace(/\D/g, '').slice(0, 8))}
              />
              <Campo
                rotulo="Turma"
                placeholder="8º ano A, 2º ano EM, 3º ano B…"
                value={turma}
                onChangeText={setTurma}
                auxiliar={
                  segmento
                    ? undefined
                    : 'Escreva como aparece no boletim, com o ano e a letra da turma.'
                }
              />
              {segmento && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Selo texto={NOME_SEGMENTO[segmento]} tom="marca" />
                  <Texto variante="legenda" suave style={{ flex: 1 }}>
                    O app se ajusta a essa faixa etária.
                  </Texto>
                </View>
              )}
            </View>
          </Superficie>

          <Superficie preenchimento={16}>
            <View style={{ gap: 12 }}>
              <Texto variante="micro" suave>
                AUTORIZAÇÃO
              </Texto>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <Switch
                  value={consentimento}
                  onValueChange={setConsentimento}
                  trackColor={{ true: cores.marca, false: cores.superficieToque }}
                  accessibilityLabel="Autorizo o uso dos dados do estudante"
                />
                <Texto variante="legenda" style={{ flex: 1 }}>
                  Autorizo o Colégio Farroupilha a tratar os dados do estudante para
                  operar a carteira, conforme a LGPD, e declaro ser seu responsável
                  legal.
                </Texto>
              </View>
              <Divisor />
              <Texto variante="legenda" suave>
                Coletamos apenas o necessário para identificar o aluno na maquininha:
                nome, matrícula e turma. Nada de dado bancário passa por aqui.
              </Texto>
            </View>
          </Superficie>

          {erro && (
            <Aviso tom="alerta" icone="alerta" texto={erro} />
          )}

          <Botao
            titulo="Enviar pedido"
            carregando={enviando}
            disabled={!completo}
            onPress={() => void enviar()}
          />
          <Botao
            titulo="Já tenho acesso"
            tipo="fantasma"
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
        <View style={{ height: 24 }} />
      </Tela>
    </KeyboardAvoidingView>
  );
}

function mascaraCpf(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

function mascaraTelefone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

function esconderEmail(email: string) {
  const [nome, dominio] = email.split('@');
  if (!dominio) return email;
  const visivel = nome.slice(0, 2);
  return `${visivel}${'•'.repeat(Math.max(2, nome.length - 2))}@${dominio}`;
}
