import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  diaSP,
  formatarData,
  formatarReais,
  mesSP,
  parseCentavos,
  variacao,
} from '@/lib/format.ts';

const semNbsp = (s) => s.replace(/ /g, ' ');

test('valores em R$ 0,00', () => {
  assert.equal(semNbsp(formatarReais(0)), 'R$ 0,00');
  assert.equal(semNbsp(formatarReais(350)), 'R$ 3,50');
  assert.equal(semNbsp(formatarReais(123456)), 'R$ 1.234,56');
});

test('datas em DD/MM/AAAA no fuso de São Paulo', () => {
  assert.equal(formatarData('2026-03-10T15:00:00Z'), '10/03/2026');
  // 02:00 UTC ainda é dia 09 às 23h em São Paulo
  assert.equal(formatarData('2026-03-10T02:00:00Z'), '09/03/2026');
});

test('dia e mês civis usam America/Sao_Paulo', () => {
  assert.equal(diaSP('2026-03-10T02:00:00Z'), '2026-03-09');
  assert.equal(mesSP('2026-03-01T02:00:00Z'), '2026-02');
});

test('entrada do teclado vira centavos', () => {
  assert.equal(parseCentavos('1234'), 1234);
  assert.equal(parseCentavos('R$ 12,34'), 1234);
  assert.equal(parseCentavos(''), 0);
});

test('comparativo mensal com sinal', () => {
  assert.equal(variacao(150, 100), '+50%');
  assert.equal(variacao(50, 100), '-50%');
  assert.equal(variacao(50, 0), null);
});
