import { mockApi } from './mock/api';
import type { Api } from './types';

/**
 * Ponto único de troca entre mock e API real.
 *
 * Para plugar o backend: implemente a interface `Api` em `services/http`
 * (mesmos métodos, mesmos tipos) e exporte-a aqui quando
 * `process.env.EXPO_PUBLIC_API_URL` estiver definido.
 */

/**
 * Trava de produção.
 *
 * O mock guarda senhas e PINs de todos os usuários no armazenamento local do
 * aparelho, com um hash não-criptográfico, e autoriza pagamentos sem nenhum
 * servidor. Isso é aceitável numa demonstração e é uma falha grave em produção
 * — então o build de release se recusa a subir com ele, em vez de subir calado.
 *
 * Para rodar uma demonstração a partir de um build de release, declare
 * `EXPO_PUBLIC_PERMITIR_MOCK=1` no ambiente do build. É uma escolha explícita,
 * registrada no histórico, e não um descuido.
 */
const ehDesenvolvimento = process.env.NODE_ENV !== 'production' || __DEV__;
const mockAutorizado = process.env.EXPO_PUBLIC_PERMITIR_MOCK === '1';

if (!ehDesenvolvimento && !mockAutorizado) {
  throw new Error(
    'Farroups-pay: build de produção sem backend. O mock guarda credenciais no ' +
      'aparelho e autoriza pagamentos sem servidor — não pode ir para produção. ' +
      'Aponte EXPO_PUBLIC_API_URL para a API real, ou declare ' +
      'EXPO_PUBLIC_PERMITIR_MOCK=1 se este build é mesmo uma demonstração.',
  );
}

export const api: Api = mockApi;

export * from './types';
