// Adapter do Core contra o meupia-core real no Pyodide (RF-09, RNF-01, RNF-07).
import { describe, it, expect, beforeAll } from 'vitest';
import { criarMotorNode } from './suporte/motor-node.js';
import { compilarEExecutar } from '../../src/core/executor-core.js';
import { MEUPIA_CORE_VERSAO } from '../../src/config.js';

const VAZIO = 'algoritmo "MeuPrograma"\n\ninicio\nfim_algoritmo\n';
const programa = (corpo, variaveis = '') =>
  `algoritmo "Teste"\n\n${variaveis ? `var\n${variaveis}\n\n` : ''}inicio\n${corpo}\nfim_algoritmo\n`;

describe('adapter do meupia-core (Core real)', () => {
  let motor;

  beforeAll(async () => {
    motor = await criarMotorNode();
  });

  it('usa a versão fixada em src/config.js', () => {
    const versao = motor.runPython('import importlib.metadata\nimportlib.metadata.version("meupia-core")');
    expect(versao).toBe(MEUPIA_CORE_VERSAO);
  });

  it('aceita o programa do cenário 1 e não escreve nada', async () => {
    await expect(compilarEExecutar(motor, VAZIO)).resolves.toEqual({ status: 'ok', saida: '', erro: null });
  });

  it('detecta erro de compilação com etapa e linha', async () => {
    const r = await compilarEExecutar(motor, programa('    se verdadeiro\n        escreva("x")\n    fim_se'));
    expect(r.status).toBe('erro_compilacao');
    expect(r.erro.etapa).toBe('sintático');
    expect(r.erro.linha).toBeGreaterThan(0);
  });

  it('recusa texto com o marcador ??? (defesa em profundidade, SC-003)', async () => {
    const r = await compilarEExecutar(motor, programa('    se ??? entao\n    fim_se'));
    expect(r.status).toBe('erro_compilacao');
  });

  it('traduz divisão por zero', async () => {
    const r = await compilarEExecutar(motor, programa('    escreva(1 / 0)'));
    expect(r.status).toBe('erro_execucao');
    expect(r.erro.mensagem).toBe('Divisão por zero');
  });

  it('lê a entrada do leia e acusa entrada esgotada', async () => {
    const corpo = '    leia(n)\n    escreva(n * 2)';
    const decl = '    n: inteiro';
    await expect(compilarEExecutar(motor, programa(corpo, decl), ['7'])).resolves.toEqual({
      status: 'ok',
      saida: '14\n',
      erro: null,
    });
    const r = await compilarEExecutar(motor, programa(corpo, decl), []);
    expect(r.status).toBe('erro_execucao');
    expect(r.erro.mensagem).toBe('O programa pediu mais dados do que os informados');
  });

  it('dois programas seguidos não compartilham variáveis nem saída', async () => {
    const primeiro = await compilarEExecutar(motor, programa('    x <- 5\n    escreva(x)', '    x: inteiro'));
    expect(primeiro.saida).toBe('5\n');
    const segundo = await compilarEExecutar(motor, programa('    escreva(x)', '    x: inteiro'));
    expect(segundo).toEqual({ status: 'ok', saida: '0\n', erro: null });
  });
});
