import AsyncStorage from '@react-native-async-storage/async-storage';
import { criarEstadoInicial, type EstadoMock } from './seed';

const CHAVE = 'farroupspay:estado:v1';

let estado: EstadoMock | null = null;
let carregando: Promise<EstadoMock> | null = null;

/** Carrega (ou recria) a base em memória, hidratando do armazenamento local. */
export async function db(): Promise<EstadoMock> {
  if (estado) return estado;
  if (!carregando) {
    carregando = (async () => {
      try {
        const bruto = await AsyncStorage.getItem(CHAVE);
        if (bruto) {
          estado = JSON.parse(bruto) as EstadoMock;
          return estado;
        }
      } catch {
        // Armazenamento indisponível: seguimos só com a base em memória.
      }
      estado = criarEstadoInicial();
      void persistir();
      return estado;
    })();
  }
  return carregando;
}

export async function persistir(): Promise<void> {
  if (!estado) return;
  try {
    await AsyncStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // Persistência é conveniência, não requisito da demonstração.
  }
}

export async function reiniciar(): Promise<void> {
  estado = criarEstadoInicial();
  carregando = null;
  await persistir();
}

/** Latência simulada para que os estados de carregamento apareçam de verdade. */
export function atraso(ms = 320): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
