import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PALETAS, type Paleta, type Segmento } from './tokens';

export * from './tokens';

export type PreferenciaTema = 'sistema' | 'claro' | 'escuro';

interface ContextoTema {
  cores: Paleta;
  escura: boolean;
  /** Faixa etária que veste o app: muda a paleta inteira. */
  segmento: Segmento;
  preferencia: PreferenciaTema;
  definirPreferencia: (p: PreferenciaTema) => void;
  /** Fontes carregadas? Enquanto não, usamos a família do sistema. */
  fonte: (peso: string) => { fontFamily?: string; fontWeight?: any };
}

const Contexto = createContext<ContextoTema | null>(null);
const CHAVE = 'farroupspay:tema';

export function ProvedorTema({
  children,
  fontesProntas,
  segmento = 'padrao',
}: {
  children: React.ReactNode;
  fontesProntas: boolean;
  segmento?: Segmento;
}) {
  const esquema = useColorScheme();
  const [preferencia, setPreferencia] = useState<PreferenciaTema>('sistema');

  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then((v) => {
        if (v === 'claro' || v === 'escuro' || v === 'sistema') setPreferencia(v);
      })
      .catch(() => undefined);
  }, []);

  const valor = useMemo<ContextoTema>(() => {
    const escura =
      preferencia === 'sistema' ? esquema === 'dark' : preferencia === 'escuro';
    return {
      escura,
      segmento,
      cores: PALETAS[segmento][escura ? 'escuro' : 'claro'],
      preferencia,
      definirPreferencia: (p) => {
        setPreferencia(p);
        AsyncStorage.setItem(CHAVE, p).catch(() => undefined);
      },
      fonte: (peso: string) => {
        if (!fontesProntas) return { fontWeight: peso as any };
        const familia =
          peso === '700'
            ? 'Sora_700Bold'
            : peso === '600'
              ? 'Sora_600SemiBold'
              : peso === '500'
                ? 'Sora_500Medium'
                : 'Sora_400Regular';
        return { fontFamily: familia };
      },
    };
  }, [preferencia, esquema, fontesProntas, segmento]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useTema(): ContextoTema {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useTema precisa estar dentro de ProvedorTema');
  return ctx;
}
