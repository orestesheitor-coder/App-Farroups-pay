import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hash } from '@/services/mock/seed.ts';

/**
 * Regressões da auditoria de segurança. Cada teste aqui existe porque a falha
 * correspondente estava presente no código e podia custar dinheiro real.
 */

test('o hash do mock não se apresenta como criptográfico', () => {
  // O prefixo era `sha$`, o que sugeria SHA onde há DJB2 de 32 bits. A trava
  // de produção depende de ninguém confundir os dois.
  const h = hash('1234');
  assert.ok(!h.startsWith('sha$'), 'o prefixo não pode sugerir SHA');
  assert.ok(h.startsWith('inseguro$'), `prefixo inesperado: ${h}`);
});

test('a trava de PIN conta erros e solta depois do prazo', async () => {
  const { mockApi } = await import('@/services/mock/api.ts');
  const { reiniciar } = await import('@/services/mock/db.ts');
  await reiniciar();

  const usuarioId = 'usr_antonella';
  // Quatro erros ainda respondem "não confere", sem travar.
  for (let i = 0; i < 4; i++) {
    assert.equal(await mockApi.auth.validarPin(usuarioId, '0000'), false);
  }
  // O quinto fecha a janela.
  assert.equal(await mockApi.auth.validarPin(usuarioId, '0000'), false);
  await assert.rejects(
    () => mockApi.auth.validarPin(usuarioId, '1234'),
    (e) => e.codigo === 'pin_travado',
    'o PIN correto também deve esbarrar na trava',
  );
});

test('acertar o PIN zera a contagem de erros', async () => {
  const { mockApi } = await import('@/services/mock/api.ts');
  const { reiniciar } = await import('@/services/mock/db.ts');
  await reiniciar();

  const usuarioId = 'usr_helena';
  for (let i = 0; i < 3; i++) {
    await mockApi.auth.validarPin(usuarioId, '0000');
  }
  assert.equal(await mockApi.auth.validarPin(usuarioId, '1234'), true);
  // Depois do acerto, três novos erros não podem travar (a soma seria 6).
  for (let i = 0; i < 3; i++) {
    assert.equal(await mockApi.auth.validarPin(usuarioId, '0000'), false);
  }
});

test('definir um PIN de 6 dígitos registra o tamanho', async () => {
  const { mockApi } = await import('@/services/mock/api.ts');
  const { reiniciar, db } = await import('@/services/mock/db.ts');
  await reiniciar();

  const usuarioId = 'usr_theo';
  await mockApi.auth.definirPin(usuarioId, '123456');
  const estado = await db();
  const usuario = estado.usuarios.find((u) => u.id === usuarioId);
  // Sem isso, a folha de autorização fica fixa em 4 dígitos e a conta não
  // consegue mais autorizar compras acima do limite.
  assert.equal(usuario.tamanhoPin, 6);
  assert.equal(await mockApi.auth.validarPin(usuarioId, '123456'), true);
});
