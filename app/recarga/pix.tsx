import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { useAsync } from '@/lib/hooks';
import { formatarReais } from '@/lib/format';
import { raio, useTema } from '@/theme';
import {
  Aviso,
  Botao,
  Cabecalho,
  EstadoErro,
  Esqueleto,
  Superficie,
  Tela,
  Texto,
  useAlerta,
} from '@/ui';

/** Espera simulada do webhook do PSP: o Pix confirma sozinho em poucos segundos. */
const SEGUNDOS_ATE_CONFIRMAR = 6;

export default function PagarComPix() {
  const { valor, conta } = useLocalSearchParams<{ valor: string; conta: string }>();
  const { cores } = useTema();
  const { avisar } = useAlerta();
  const { invalidar } = useSessao();
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const jaConfirmou = useRef(false);

  const centavos = Number(valor ?? 0);
  const cobranca = useAsync(() => api.recargas.criarPix(String(conta), centavos), [conta, valor]);

  async function confirmar() {
    if (!cobranca.dados || jaConfirmou.current) return;
    jaConfirmou.current = true;
    setConfirmando(true);
    try {
      const t = await api.recargas.confirmarPix(cobranca.dados.id);
      invalidar();
      router.replace({
        pathname: '/recarga/sucesso',
        params: { valor: String(t.valorCentavos), conta: String(conta), metodo: 'Pix' },
      });
    } catch (e) {
      jaConfirmou.current = false;
      avisar(e instanceof Error ? e.message : 'Não foi possível confirmar o Pix.', 'erro');
    } finally {
      setConfirmando(false);
    }
  }

  useEffect(() => {
    if (!cobranca.dados) return;
    const t = setTimeout(() => void confirmar(), SEGUNDOS_ATE_CONFIRMAR * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cobranca.dados?.id]);

  return (
    <Tela
      aoFinal={
        <Botao
          titulo="Já paguei"
          carregando={confirmando}
          disabled={!cobranca.dados}
          onPress={() => void confirmar()}
        />
      }
    >
      <Cabecalho
        titulo="Pague com Pix"
        subtitulo={`Recarga de ${formatarReais(centavos)} · confirmação automática`}
      />

      {cobranca.erro ? (
        <EstadoErro mensagem={cobranca.erro} aoTentarNovamente={cobranca.recarregar} />
      ) : (
        <View style={{ gap: 16 }}>
          <Superficie preenchimento={20}>
            <View style={{ alignItems: 'center', gap: 16 }}>
              {cobranca.carregando || !cobranca.dados ? (
                <Esqueleto altura={196} largura={196} arredondamento={raio.lg} />
              ) : (
                <View
                  style={{
                    padding: 16,
                    borderRadius: raio.lg,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: cores.borda,
                  }}
                >
                  <QRCode
                    value={cobranca.dados.brcode}
                    size={184}
                    backgroundColor="#FFFFFF"
                    color="#14161A"
                  />
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color={cores.textoSuave} />
                <Texto variante="legenda" suave>
                  Aguardando confirmação do banco
                </Texto>
              </View>
            </View>
          </Superficie>

          <Superficie preenchimento={16}>
            <View style={{ gap: 10 }}>
              <Texto variante="legenda" peso="600" suave>
                PIX COPIA E COLA
              </Texto>
              <Texto variante="legenda" numberOfLines={3} style={{ color: cores.textoSuave }}>
                {cobranca.dados?.brcode ?? '—'}
              </Texto>
              <Botao
                titulo="Copiar código"
                tipo="secundario"
                icone="copiar"
                compacto
                disabled={!cobranca.dados}
                onPress={async () => {
                  await Clipboard.setStringAsync(cobranca.dados?.brcode ?? '');
                  avisar('Código Pix copiado.', 'sucesso');
                }}
              />
            </View>
          </Superficie>

          <Aviso
            icone="escudo"
            texto="O saldo é creditado assim que o banco confirma o pagamento. Nenhum dado bancário é guardado no app."
          />
        </View>
      )}
      <View style={{ height: 16 }} />
    </Tela>
  );
}
