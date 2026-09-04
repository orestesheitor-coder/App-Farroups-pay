import { mockApi } from './mock/api';
import type { Api } from './types';

/**
 * Ponto único de troca entre mock e API real.
 *
 * Para plugar o backend: implemente a interface `Api` em `services/http`
 * (mesmos métodos, mesmos tipos) e exporte-a aqui quando
 * `process.env.EXPO_PUBLIC_API_URL` estiver definido.
 */
export const api: Api = mockApi;

export * from './types';
