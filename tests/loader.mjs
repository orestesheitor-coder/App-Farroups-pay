import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function primeiroExistente(base) {
  for (const candidato of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
    if (existsSync(candidato) && !existsSync(path.join(candidato, '.'))) {
      // ignora diretórios
    }
    if (existsSync(candidato) && path.extname(candidato)) return candidato;
  }
  return null;
}

/** Resolve o alias "@/" e imports relativos sem extensão, como o Metro faz. */
export function resolve(especificador, contexto, proximo) {
  if (especificador.startsWith('@/')) {
    const alvo = primeiroExistente(path.join(raiz, 'src', especificador.slice(2)));
    if (alvo) return { url: pathToFileURL(alvo).href, shortCircuit: true };
  }
  if (
    (especificador.startsWith('./') || especificador.startsWith('../')) &&
    !path.extname(especificador) &&
    contexto.parentURL?.startsWith('file:')
  ) {
    const base = path.resolve(
      path.dirname(fileURLToPath(contexto.parentURL)),
      especificador,
    );
    const alvo = primeiroExistente(base);
    if (alvo) return { url: pathToFileURL(alvo).href, shortCircuit: true };
  }
  return proximo(especificador, contexto);
}
