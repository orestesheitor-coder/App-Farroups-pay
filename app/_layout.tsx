import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  useFonts,
} from '@expo-google-fonts/sora';
import { ProvedorTema, useTema } from '@/theme';
import { ProvedorSessao, useSessao } from '@/state/sessao';
import { ProvedorAlerta } from '@/ui';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function LayoutRaiz() {
  const [fontesProntas, erroFontes] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  useEffect(() => {
    if (fontesProntas || erroFontes) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontesProntas, erroFontes]);

  return (
    <SafeAreaProvider>
      <ProvedorSessao>
        <TemaDaSessao fontesProntas={!!fontesProntas}>
          <ProvedorAlerta>
            <Navegacao />
          </ProvedorAlerta>
        </TemaDaSessao>
      </ProvedorSessao>
    </SafeAreaProvider>
  );
}

/**
 * O app se veste conforme quem entrou: infantil, padrão ou profissional.
 * Perfis adultos — responsável, lojista, secretaria — ficam sempre no padrão.
 */
function TemaDaSessao({
  children,
  fontesProntas,
}: {
  children: React.ReactNode;
  fontesProntas: boolean;
}) {
  const { usuario } = useSessao();
  return (
    <ProvedorTema fontesProntas={fontesProntas} segmento={usuario?.segmento ?? 'padrao'}>
      {children}
    </ProvedorTema>
  );
}

function Navegacao() {
  const { cores, escura } = useTema();
  return (
    <>
      <StatusBar style={escura ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 260,
          contentStyle: { backgroundColor: cores.fundo },
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="recarga" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="pagar" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
