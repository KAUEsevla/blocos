// Blocos variavel_recebe e variavel (spec 002, RF-02; FR-005, FR-006;
// contracts/blocos-variaveis.md, "Exemplos normativos").
import { describe, it, expect } from 'vitest';
import { BLOCO_VARIAVEL_RECEBE, BLOCO_VARIAVEL } from '../../src/blocos/variaveis.js';
import { PRECEDENCIA } from '../../src/portugol/precedencia.js';
import { TIPOS_VARIAVEL } from '../../src/projeto/formato.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { verificarExecucao } from '../../src/portugol/execucao.js';
import { criarRegistroTeste, bloco, projetoDeTeste } from '../auxiliares/blocos-teste.js';

const registro = criarRegistroTeste();
registro.registrarBloco(BLOCO_VARIAVEL_RECEBE);
registro.registrarBloco(BLOCO_VARIAVEL);

const IDADE = { id: 'v-idade', nome: 'idade', tipo: 'inteiro' };
const ANOS = { id: 'v-anos', nome: 'anos', tipo: 'inteiro' };

const ler = (variavel) => bloco('variavel', { campos: { VAR: variavel ? { id: variavel.id } : null } });
const recebe = (variavel, valor) =>
  bloco('variavel_recebe', {
    campos: { VAR: variavel ? { id: variavel.id } : null },
    entradas: valor ? { VALOR: valor } : {},
  });
const numero = (n) => bloco('teste_numero', { campos: { NUM: n } });

function corpo(variaveis, comandos) {
  const { codigo, avisos } = gerarPortugol(projetoDeTeste({ variaveis, comandos }), registro);
  const linhas = codigo.split('\n');
  const inicio = linhas.indexOf('inicio');
  const fim = linhas.indexOf('fim_algoritmo');
  return { linhas: linhas.slice(inicio + 1, fim), avisos: avisos.map((a) => a.mensagem), codigo, resultado: { codigo, avisos } };
}

describe('exemplos normativos (contracts/blocos-variaveis.md)', () => {
  it('idade recebe [anos] → idade <- anos, sem avisos', () => {
    const r = corpo([IDADE, ANOS], [recebe(IDADE, ler(ANOS))]);
    expect(r.linhas).toEqual(['    idade <- anos']);
    expect(r.avisos).toEqual([]);
  });

  it('História 2, cenário 2: idade recebe [ ] → idade <- ??? com aviso e Executar bloqueado', () => {
    const r = corpo([IDADE], [recebe(IDADE, null)]);
    expect(r.linhas).toEqual(['    idade <- ???']);
    expect(r.avisos).toEqual(['Falta o valor do bloco recebe']);
    expect(verificarExecucao(r.resultado).permitida).toBe(false);
  });

  it('[ ] recebe [ ] → ??? <- ???, avisos da variável e depois do valor', () => {
    const r = corpo([], [recebe(null, null)]);
    expect(r.linhas).toEqual(['    ??? <- ???']);
    expect(r.avisos).toEqual(['Falta a variável do bloco recebe', 'Falta o valor do bloco recebe']);
  });

  it('variável apagada do projeto dentro do valor → ??? com aviso do bloco variável', () => {
    const r = corpo([IDADE], [recebe(IDADE, ler(ANOS))]);
    expect(r.linhas).toEqual(['    idade <- ???']);
    expect(r.avisos).toEqual(['Falta a variável do bloco variável']);
  });

  it('História 2, cenário 1: idade recebe [15] → idade <- 15', () => {
    const r = corpo([IDADE], [recebe(IDADE, numero(15))]);
    expect(r.linhas).toEqual(['    idade <- 15']);
    expect(r.avisos).toEqual([]);
  });

  it('escreva(idade + 1) com os blocos de teste de escreva, soma e número', () => {
    const soma = bloco('teste_soma', { entradas: { A: ler(IDADE), B: numero(1) } });
    const r = corpo([IDADE], [bloco('teste_escreva', { entradas: { VALOR: soma } })]);
    expect(r.linhas).toEqual(['    escreva(idade + 1)']);
    expect(r.avisos).toEqual([]);
  });
});

describe('entradas do registro', () => {
  it('variavel_recebe: comando com rótulo "recebe", sem áreas nem variantes', () => {
    expect(BLOCO_VARIAVEL_RECEBE).toMatchObject({ tipo: 'variavel_recebe', rotulo: 'recebe', categoria: 'comando' });
    expect(registro.obter('variavel_recebe').areas).toEqual([]);
    expect(registro.obter('variavel_recebe').variantes).toEqual([]);
  });

  it('variavel: valor com rótulo "variável", sem áreas nem variantes', () => {
    expect(BLOCO_VARIAVEL).toMatchObject({ tipo: 'variavel', rotulo: 'variável', categoria: 'valor' });
    expect(registro.obter('variavel').areas).toEqual([]);
    expect(registro.obter('variavel').variantes).toEqual([]);
  });

  it('definições: campo VAR é campo_variavel com os quatro tipos; VALOR é input_value; variavel tem output null', () => {
    const [campoRecebe, valor] = BLOCO_VARIAVEL_RECEBE.definicao.args0;
    expect(BLOCO_VARIAVEL_RECEBE.definicao.type).toBe('variavel_recebe');
    expect(campoRecebe).toMatchObject({ type: 'campo_variavel', name: 'VAR', variableTypes: [...TIPOS_VARIAVEL] });
    expect(valor).toMatchObject({ type: 'input_value', name: 'VALOR' });

    const [campoLer] = BLOCO_VARIAVEL.definicao.args0;
    expect(BLOCO_VARIAVEL.definicao.type).toBe('variavel');
    expect(campoLer).toMatchObject({ type: 'campo_variavel', name: 'VAR', variableTypes: [...TIPOS_VARIAVEL] });
    expect(BLOCO_VARIAVEL.definicao.output).toBeNull();
  });

  it('gerar do variavel devolve a precedência PRIMARIO', () => {
    const ctx = { variavel: () => 'idade' };
    expect(BLOCO_VARIAVEL.gerar(ler(IDADE), ctx)).toEqual({ codigo: 'idade', precedencia: PRECEDENCIA.PRIMARIO });
  });
});
