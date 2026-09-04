import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { useAsync } from '@/lib/hooks';
import { VALORES_RAPIDOS, validarRecarga } from '@/domain/regras';
import { formatarReais, parseCentavos } from '@/lib/format';
import { raio, useTema } from '@/theme';
import {
  Botao,
  Cabecalho,
  EstadoErro,
  Esqueleto,
  Icone,
  LinhaLista,
  MarcaLoja,
  Pilula,
  Superficie,
  Tela,
  TecladoNumerico,
  Texto,
  Valor,
} from '@/ui';

export default function AdicionarSaldo() {
  const { usuario, alunoAtivoId, versao } = useSessao();
  const { cores } = useTema();
  const router = useRouter();
  const [digitos, setDigitos] = useState('');
  const [metodo, setMetodo] = useState<'pix' | 'credito'>('pix');

  const alunoId = alunoAtivoId ?? usuario?.alunoId ?? '';
  const estado = useAsync(() => api.carteira.resumo(alunoId), [alunoId, versao]);
  const centavos = parseCentavos(digitos);
  const erro = centavos > 0 ? validarRecarga(centavos) : null;

  return (
    <Tela
      rolagem={false}
      estilo={{ flex: 1 }}
      aoFinal={
        <Botao
          titulo={centavos > 0 ? `Continuar · ${formatarReais(centavos)}` : 'Continuar'}
          disabled={centavos === 0 || !!erro || !estado.dados}
          onPress={() =>
            router.push({
              pathname: metodo === 'pix' ? '/recarga/pix' : '/recarga/credito',
              params: { valor: String(centavos), conta: estado.dados?.conta.id ?? '' },
            })
          }
        />
      }
    >
      <Cabecalho titulo="Adicionar saldo" subtitulo="O saldo só pode ser usado nas lojas do colégio." />

      {estado.erro ? (
        <EstadoErro mensagem={estado.erro} aoTentarNovamente={estado.recarregar} />
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 18, paddingBottom: 12 }}
          >
            <View style={{ alignItems: 'center', paddingVertical: 6, gap: 6 }}>
              <Valor centavos={centavos} tamanho={44} cor={centavos ? cores.texto : cores.textoSuave} />
              {estado.carregando ? (
                <Esqueleto altura={14} largura={140} />
              ) : (
                <Texto variante="legenda" suave>
                  Saldo atual: {formatarReais(estado.dados?.conta.saldoCentavos ?? 0)}
                </Texto>
              )}
              {erro && (
                <Texto variante="legenda" cor={cores.alerta}>
                  {erro}
                </Texto>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
              {VALORES_RAPIDOS.map((v) => (
                <Pilula
                  key={v}
                  titulo={formatarReais(v).replace(',00', '')}
                  ativa={centavos === v}
                  onPress={() => setDigitos(String(v))}
                />
              ))}
            </View>

            <Superficie preenchimento={4}>
              <View style={{ paddingHorizontal: 12 }}>
                <LinhaLista
                  primeira
                  titulo="Pix"
                  descricao="Cai na hora, sem taxa"
                  esquerda={<MarcaLoja tamanho={38} tom="sucesso" icone="pix" />}
                  onPress={() => setMetodo('pix')}
                  direita={<Marcador ativo={metodo === 'pix'} />}
                />
                <LinhaLista
                  titulo="Cartão de crédito"
                  descricao="Processado por gateway certificado"
                  esquerda={<MarcaLoja tamanho={38} tom="marca" icone="cartao" />}
                  onPress={() => setMetodo('credito')}
                  direita={<Marcador ativo={metodo === 'credito'} />}
                />
              </View>
            </Superficie>

            <LinhaLista
              primeira
              titulo="Recarga automática"
              descricao={
                estado.dados?.conta.recargaAutomatica?.ativa
                  ? `Abaixo de ${formatarReais(estado.dados.conta.recargaAutomatica.gatilhoCentavos)}, recarrega ${formatarReais(estado.dados.conta.recargaAutomatica.valorCentavos)}`
                  : 'Desativada'
              }
              esquerda={<Icone nome="atualizar" cor={cores.textoSuave} />}
              onPress={() =>
                router.push({
                  pathname: '/recarga/automatica',
                  params: { conta: estado.dados?.conta.id ?? '' },
                })
              }
            />
          </ScrollView>

          <View style={{ paddingBottom: 4 }}>
            <TecladoNumerico
              mostrarVirgula={false}
              aoDigitar={(d) => setDigitos((v) => (v + d).replace(/^0+/, '').slice(0, 7))}
              aoApagar={() => setDigitos((v) => v.slice(0, -1))}
              compacto
            />
          </View>
        </View>
      )}
    </Tela>
  );
}

function Marcador({ ativo }: { ativo: boolean }) {
  const { cores } = useTema();
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: raio.pill,
        borderWidth: 2,
        borderColor: ativo ? cores.marca : cores.borda,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {ativo && (
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cores.marca }} />
      )}
    </View>
  );
}
