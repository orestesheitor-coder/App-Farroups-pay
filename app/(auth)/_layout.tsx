import { Stack } from 'expo-router';
import { useTema } from '@/theme';

export default function LayoutAuth() {
  const { cores } = useTema();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 260,
        contentStyle: { backgroundColor: cores.fundo },
      }}
    />
  );
}
