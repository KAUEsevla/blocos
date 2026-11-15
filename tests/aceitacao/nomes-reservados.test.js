// Lista de nomes reservados × Python real do Pyodide (spec 002, RF-02; FR-003, SC-002;
// research R-03). Se o Pyodide (ou o Python dele) mudar, este teste aponta o que falta.
import { describe, it, expect, beforeAll } from 'vitest';
import { criarMotorNode } from './suporte/motor-node.js';
import { NOMES_RESERVADOS } from '../../src/projeto/nome-variavel.js';

describe('nomes reservados × Python do Pyodide', () => {
  let pyodide;

  beforeAll(async () => {
    pyodide = await criarMotorNode();
  });

  it('o Python do Pyodide é o 3.11 (base do research R-03)', () => {
    expect(pyodide.runPython('import sys; sys.version')).toMatch(/^3\.11\./);
  });

  it('toda palavra-chave e todo nome de builtins que começa com letra está em NOMES_RESERVADOS', () => {
    const nomes = JSON.parse(pyodide.runPython('import keyword, builtins, json; json.dumps(keyword.kwlist + dir(builtins))'));
    const faltando = nomes
      .filter((nome) => /^[A-Za-z]/.test(nome))
      .filter((nome) => !NOMES_RESERVADOS.has(nome.toLowerCase()));
    expect(faltando, `faltam em NOMES_RESERVADOS: ${faltando.join(', ')}`).toEqual([]);
  });
});
