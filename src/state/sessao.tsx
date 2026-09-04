import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { router } from 'expo-router';
import { api } from '@/services';
import type { PreferenciasNotificacao, Sessao, Usuario } from '@/domain/types';

interface ContextoSessao {
  sessao: Sessao | null;
  usuario: Usuario | null;
  carregando: boolean;
  /** Aluno em foco: o próprio (perfil aluno) ou o selecionado pelo responsável. */
  alunoAtivoId: string | null;
  definirAlunoAtivo: (id: string) => void;
  entrar: (login: string, senha: string) => Promise<Sessao>;
  sair: () => Promise<void>;
  atualizarUsuario: (u: Usuario) => void;
  salvarNotificacoes: (prefs: PreferenciasNotificacao) => Promise<void>;
  /** Marca de tempo da última mudança de saldo, para as telas recarregarem. */
  versao: number;
  invalidar: () => void;
}

const Contexto = createContext<ContextoSessao | null>(null);

export function ProvedorSessao({ children }: { children: React.ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [alunoAtivoId, setAlunoAtivoId] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    api.auth
      .restaurarSessao()
      .then((s) => {
        if (s) {
          setSessao(s);
          setAlunoAtivoId(s.usuario.alunoId ?? s.usuario.alunosIds?.[0] ?? null);
        }
      })
      .catch(() => undefined)
      .finally(() => setCarregando(false));
  }, []);

  const entrar = useCallback(async (login: string, senha: string) => {
    const s = await api.auth.entrar(login, senha);
    setSessao(s);
    setAlunoAtivoId(s.usuario.alunoId ?? s.usuario.alunosIds?.[0] ?? null);
    return s;
  }, []);

  const sair = useCallback(async () => {
    await api.auth.sair();
    setSessao(null);
    setAlunoAtivoId(null);
    router.replace('/(auth)/login');
  }, []);

  const valor = useMemo<ContextoSessao>(
    () => ({
      sessao,
      usuario: sessao?.usuario ?? null,
      carregando,
      alunoAtivoId,
      definirAlunoAtivo: setAlunoAtivoId,
      entrar,
      sair,
      atualizarUsuario: (u) => setSessao((s) => (s ? { ...s, usuario: u } : s)),
      salvarNotificacoes: async (prefs) => {
        if (!sessao) return;
        const u = await api.auth.atualizarNotificacoes(sessao.usuario.id, prefs);
        setSessao((s) => (s ? { ...s, usuario: u } : s));
      },
      versao,
      invalidar: () => setVersao((v) => v + 1),
    }),
    [sessao, carregando, alunoAtivoId, entrar, sair, versao],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ContextoSessao {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useSessao precisa estar dentro de ProvedorSessao');
  return ctx;
}
