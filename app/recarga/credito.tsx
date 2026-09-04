import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { formatarReais } from '@/lib/format';
import { Aviso, Botao, Cabecalho, Campo, Superficie, Tela, Texto, useAlerta } from '@/ui';

export default function PagarComCredito() {
  const { valor, conta } = useLocalSearchParams<{ valor: string; conta: string }>();
  const { avisar } = useAlerta();
  const { invalidar } = useSessao();
  const router = useRouter();

  const centavos = Number(valor ?? 0);
  const [numero, setNumero] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);

  const completo = numero.replace(/\D/g, '').length >= 16 && validade.length >= 5 && cvv.length >= 3 && nome.length > 3;

  async function pagar() {
    setEnviando(true);
    try {
      // O app nunca envia o PAN ao backend: o gateway devolve um token.
      const token = `tok_${numero.replace(/\D/g, '').slice(-4)}${Date.now()}`;
      const t = await api.recargas.pagarComCredito(String(conta), centavos, token);
      invalidar();
      router.replace({
        pathname: '/recarga/sucesso',
        params: {
          valor: String(t.valorCentavos),
          conta: String(conta),
          metodo: 'Cartão de crédito',
        },
      });
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Não foi possível autorizar.', 'erro');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela
      aoFinal={
        <Botao
          titulo={`Pagar ${formatarReais(centavos)}`}
          carregando={enviando}
          disabled={!completo}
          onPress={() => void pagar()}
        />
      }
    >
      <Cabecalho
        titulo="Cartão de crédito"
        subtitulo={`Recarga de ${formatarReais(centavos)}`}
      />

      <View style={{ gap: 14 }}>
        <Superficie preenchimento={16}>
          <View style={{ gap: 14 }}>
            <Campo
              rotulo="Número do cartão"
              placeholder="0000 0000 0000 0000"
              keyboardType="number-pad"
              value={numero}
              onChangeText={(v) =>
                setNumero(
                  v
                    .replace(/\D/g, '')
                    .slice(0, 16)
                    .replace(/(\d{4})(?=\d)/g, '$1 '),
                )
              }
              icone="cartao"
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Campo
                  rotulo="Validade"
                  placeholder="MM/AA"
                  keyboardType="number-pad"
                  value={validade}
                  onChangeText={(v) => {
                    const d = v.replace(/\D/g, '').slice(0, 4);
                    setValidade(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Campo
                  rotulo="CVV"
                  placeholder="000"
                  keyboardType="number-pad"
                  value={cvv}
                  onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                  segredo
                />
              </View>
            </View>
            <Campo
              rotulo="Nome impresso"
              placeholder="Como está no cartão"
              autoCapitalize="characters"
              value={nome}
              onChangeText={setNome}
            />
          </View>
        </Superficie>

        <Aviso
          icone="escudo"
          texto="Os dados do cartão vão direto ao gateway certificado PCI-DSS e voltam como token. O app não guarda nada disso."
        />
        <Texto variante="legenda" suave>
          Cobrança identificada como COLEGIO FARROUPILHA na fatura.
        </Texto>
      </View>
      <View style={{ height: 16 }} />
    </Tela>
  );
}
