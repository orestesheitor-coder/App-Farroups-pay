import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export interface EstadoAsync<T> {
  dados: T | null;
  carregando: boolean;
  erro: string | null;
  recarregar: () => void;
  atualizando: boolean;
}

/**
 * Carrega dados com os três estados que toda tela precisa desenhar:
 * carregando, erro e vazio.
 */
export function useAsync<T>(
  carregar: () => Promise<T>,
  deps: unknown[] = [],
  opcoes: { recarregarAoFocar?: boolean } = {},
): EstadoAsync<T> {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const vivo = useRef(true);
  const carregarRef = useRef(carregar);
  carregarRef.current = carregar;

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  const executar = useCallback(
    async (silencioso: boolean) => {
      if (silencioso) setAtualizando(true);
      else setCarregando(true);
      setErro(null);
      try {
        const resultado = await carregarRef.current();
        if (vivo.current) setDados(resultado);
      } catch (e) {
        if (vivo.current) {
          setErro(e instanceof Error ? e.message : 'Não foi possível carregar agora.');
        }
      } finally {
        if (vivo.current) {
          setCarregando(false);
          setAtualizando(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void executar(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const primeiraVez = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (!opcoes.recarregarAoFocar) return;
      if (primeiraVez.current) {
        primeiraVez.current = false;
        return;
      }
      void executar(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps),
  );

  return {
    dados,
    carregando,
    erro,
    atualizando,
    recarregar: () => void executar(dados !== null),
  };
}

/** Contagem regressiva em segundos — usada no QR dinâmico e no Pix. */
export function useContagem(segundosIniciais: number, aoZerar?: () => void) {
  const [restante, setRestante] = useState(segundosIniciais);
  const aoZerarRef = useRef(aoZerar);
  aoZerarRef.current = aoZerar;

  useEffect(() => {
    setRestante(segundosIniciais);
  }, [segundosIniciais]);

  useEffect(() => {
    if (restante <= 0) {
      aoZerarRef.current?.();
      return;
    }
    const t = setTimeout(() => setRestante((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [restante]);

  return { restante, reiniciar: () => setRestante(segundosIniciais) };
}
