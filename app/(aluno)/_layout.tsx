import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '@/theme';
import type { ColorValue } from 'react-native';
import { Icone, type NomeIcone } from '@/ui';

function aba(nome: NomeIcone) {
  return ({ color }: { color: ColorValue }) => (
    <Icone nome={nome} cor={String(color)} tamanho={22} />
  );
}

export default function LayoutAluno() {
  const { cores, fonte } = useTema();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.marca,
        tabBarInactiveTintColor: cores.textoSuave,
        tabBarStyle: {
          backgroundColor: cores.superficie,
          borderTopColor: cores.borda,
          height: 70 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
        },
        tabBarLabelStyle: { fontSize: 11, lineHeight: 15, marginTop: 2, ...fonte('600') },
        sceneStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Carteira', tabBarIcon: aba('carteira') }} />
      <Tabs.Screen name="cartao" options={{ title: 'Cartão', tabBarIcon: aba('cartao') }} />
      <Tabs.Screen name="extrato" options={{ title: 'Extrato', tabBarIcon: aba('recibo') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: aba('perfil') }} />
    </Tabs>
  );
}
