import React from 'react';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '@/theme';
import { Icone, type NomeIcone } from '@/ui';

function aba(nome: NomeIcone) {
  return ({ color }: { color: ColorValue }) => (
    <Icone nome={nome} cor={String(color)} tamanho={22} />
  );
}

export default function LayoutResponsavel() {
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
      <Tabs.Screen name="index" options={{ title: 'Alunos', tabBarIcon: aba('usuarios') }} />
      <Tabs.Screen name="recargas" options={{ title: 'Recargas', tabBarIcon: aba('carteira') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: aba('perfil') }} />
      <Tabs.Screen name="aluno/[id]" options={{ href: null }} />
    </Tabs>
  );
}
