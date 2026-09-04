const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function id(prefixo: string): string {
  let s = '';
  for (let i = 0; i < 10; i++) {
    s += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return `${prefixo}_${s}`;
}

/** Chave de idempotência: mesma intenção -> mesma chave -> um único débito. */
export function chaveIdempotencia(...partes: (string | number)[]): string {
  return partes.join(':');
}

export function codigoNumerico(tamanho: number): string {
  let s = '';
  for (let i = 0; i < tamanho; i++) s += Math.floor(Math.random() * 10);
  return s;
}
