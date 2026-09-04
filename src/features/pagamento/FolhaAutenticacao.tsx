import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { formatarReais } from '@/lib/format';
import { useTema } from '@/theme';
import { Botao, Folha, PontosPin, TecladoNumerico, Texto } from '@/ui';

/** Compras acima de R$ 50,00 pedem PIN — ou biometria, quando ativada. */
export function FolhaAutenticacao({
  visivel,
  valorCentavos,
  biometriaAtiva,
  erro,
  aoFechar,
  aoConfirmar,
}: {
  visivel: boolean;
  valorCentavos: number;
  biometriaAtiva: boolean;
  erro?: string | null;
  aoFechar: () => void;
  aoConfirmar: (dados: { pin?: string; biometria?: boolean }) => void;
}) {
  const { cores } = useTema();
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (visivel) setPin('');
  }, [visivel]);

  useEffect(() => {
    if (pin.length === 4) {
      const digitado = pin;
      setTimeout(() => {
        aoConfirmar({ pin: digitado });
        setPin('');
      }, 140);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  async function comBiometria() {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: `Autorizar ${formatarReais(valorCentavos)}`,
      cancelLabel: 'Usar PIN',
    });
    if (r.success) aoConfirmar({ biometria: true });
  }

  return (
    <Folha
      visivel={visivel}
      aoFechar={aoFechar}
      titulo="Confirme o pagamento"
      subtitulo={`${formatarReais(valorCentavos)} · compras acima de R$ 50,00 pedem autorização`}
    >
      <View style={{ gap: 16 }}>
        <View style={{ paddingVertical: 10 }}>
          <PontosPin tamanho={4} preenchidos={pin.length} erro={!!erro} />
        </View>
        {erro && (
          <Texto variante="legenda" centro cor={cores.alerta}>
            {erro}
          </Texto>
        )}
        <TecladoNumerico
          compacto
          mostrarVirgula={false}
          aoDigitar={(d) => setPin((p) => (p + d).slice(0, 4))}
          aoApagar={() => setPin((p) => p.slice(0, -1))}
        />
        {biometriaAtiva && (
          <Botao
            titulo="Usar biometria"
            tipo="fantasma"
            icone="escudo"
            onPress={() => void comBiometria()}
          />
        )}
      </View>
    </Folha>
  );
}
