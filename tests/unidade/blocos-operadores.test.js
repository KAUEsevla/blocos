// Blocos de operadores da spec 006 (RF-06; research R-03 a R-07; contracts/blocos-operadores.md).
import { describe, it, expect } from 'vitest';
import { PRECEDENCIA } from '../../src/portugol/precedencia.js';

describe('escala de precedência (R-03)', () => {
  it('tem os oito níveis da escala da 008/R-02, congelada', () => {
    expect(Object.isFrozen(PRECEDENCIA)).toBe(true);
    expect(PRECEDENCIA).toEqual({
      OU: 10,
      E: 20,
      NAO: 30,
      RELACIONAL: 40,
      ADITIVO: 50,
      MULTIPLICATIVO: 60,
      UNARIO: 70,
      PRIMARIO: 100,
    });
  });

  it('mantém os níveis da 003', () => {
    expect(PRECEDENCIA.ADITIVO).toBe(50);
    expect(PRECEDENCIA.MULTIPLICATIVO).toBe(60);
    expect(PRECEDENCIA.PRIMARIO).toBe(100);
  });
});
