// Adapter do Core contra o meupia-core real no Pyodide (RF-09, RNF-01, RNF-07).
import { describe, it, expect, beforeAll } from 'vitest';
import { criarMotorNode } from './suporte/motor-node.js';
import { compilarEExecutar, continuarExecucao } from '../../src/core/executor-core.js';
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
    expect(r.erro.mensagem).toBe('Não é possível dividir por zero.');
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
    expect(r.erro.mensagem).toBe('O programa pediu mais dados do que os informados.');
  });

  it('dois programas seguidos não compartilham variáveis nem saída', async () => {
    const primeiro = await compilarEExecutar(motor, programa('    x <- 5\n    escreva(x)', '    x: inteiro'));
    expect(primeiro.saida).toBe('5\n');
    const segundo = await compilarEExecutar(motor, programa('    escreva(x)', '    x: inteiro'));
    expect(segundo).toEqual({ status: 'ok', saida: '0\n', erro: null });
  });

  // Spec 009 (contracts/adapter-core.md): escrita em fluxo e rastro técnico.
  describe('aoEscrever e rastro (spec 009)', () => {
    it('os pedaços somados são iguais a resultado.saida', async () => {
      const pedacos = [];
      const r = await compilarEExecutar(motor, programa('    escreva("a")\n    escreva("b")'), [], {
        aoEscrever: (texto) => pedacos.push(texto),
      });
      expect(r.status).toBe('ok');
      expect(r.saida).toBe('a\nb\n');
      expect(pedacos.join('')).toBe(r.saida);
    });

    it('o stdout do compilador não chega a aoEscrever', async () => {
      const pedacos = [];
      const aoEscrever = (texto) => pedacos.push(texto);
      await compilarEExecutar(motor, VAZIO, [], { aoEscrever });
      expect(pedacos).toEqual([]);
      const invalido = await compilarEExecutar(
        motor,
        programa('    se verdadeiro\n        escreva("x")\n    fim_se'),
        [],
        { aoEscrever },
      );
      expect(invalido.status).toBe('erro_compilacao');
      expect(pedacos).toEqual([]);
    });

    it('erro de execução traz o rastro Python no detalhe', async () => {
      const r = await compilarEExecutar(motor, programa('    escreva(1 / 0)'));
      expect(r.status).toBe('erro_execucao');
      expect(r.erro.detalhe).toContain('Traceback');
      expect(r.erro.detalhe).toContain('ZeroDivisionError');
    });
  });

  // Spec 010 (contracts/adapter-core.md; research R-02, R-03): modo interativo.
  describe('modo interativo (spec 010)', () => {
    const QUATRO_TIPOS_DECL = '    nome: cadeia\n    idade: inteiro\n    altura: real\n    ok: logico';
    const QUATRO_TIPOS = programa(
      '    leia(nome)\n    leia(idade)\n    leia(altura)\n    leia(ok)\n    escreva(nome, idade, altura, ok)',
      QUATRO_TIPOS_DECL,
    );
    const LACO = programa(
      '    escreva("antes")\n    enquanto i < 2 faca\n        leia(nome)\n        escreva("Oi, ", nome)\n        i <- i + 1\n    fim_enquanto',
      '    nome: cadeia\n    i: inteiro',
    );

    it('pede nome, idade, altura e ok, um de cada vez, nos quatro tipos', async () => {
      const valores = ['Ana', '15', '1.5', 'verdadeiro'];
      const pedidos = [];
      for (let n = 0; n < valores.length; n += 1) {
        const r = await compilarEExecutar(motor, QUATRO_TIPOS, valores.slice(0, n), { interativo: true });
        expect(r.status).toBe('aguardando_entrada');
        expect(r.erro).toBeNull();
        pedidos.push(r.pedido.variavel);
      }
      expect(pedidos).toEqual(['nome', 'idade', 'altura', 'ok']);
      const fim = await compilarEExecutar(motor, QUATRO_TIPOS, valores, { interativo: true });
      expect(fim).toEqual({ status: 'ok', saida: 'Ana151.5verdadeiro\n', erro: null });
    });

    it('um leia dentro de um enquanto pede o mesmo nome a cada volta', async () => {
      const primeiro = await compilarEExecutar(motor, LACO, [], { interativo: true });
      expect(primeiro).toMatchObject({ status: 'aguardando_entrada', saida: 'antes\n', pedido: { variavel: 'nome' } });
      const segundo = await compilarEExecutar(motor, LACO, ['Ana'], { interativo: true });
      expect(segundo).toMatchObject({ status: 'aguardando_entrada', saida: 'antes\nOi, Ana\n', pedido: { variavel: 'nome' } });
      const fim = await compilarEExecutar(motor, LACO, ['Ana', 'Bia'], { interativo: true });
      expect(fim).toEqual({ status: 'ok', saida: 'antes\nOi, Ana\nOi, Bia\n', erro: null });
    });

    it('continuarExecucao reexecuta o programa compilado sem recompilar', async () => {
      const r = await compilarEExecutar(motor, LACO, [], { interativo: true });
      expect(r.status).toBe('aguardando_entrada');
      // Um main.por inválido não muda nada: continuarExecucao não compila de novo.
      motor.FS.writeFile('main.por', 'texto inválido');
      const pedacos = [];
      const fim = await continuarExecucao(motor, ['Ana', 'Bia'], {
        interativo: true,
        aoEscrever: (t) => pedacos.push(t),
      });
      expect(fim).toEqual({ status: 'ok', saida: 'antes\nOi, Ana\nOi, Bia\n', erro: null });
      expect(pedacos.join('')).toBe(fim.saida);
    });

    it('sem interativo, a entrada esgotada continua sendo erro de execução', async () => {
      const r = await compilarEExecutar(motor, programa('    leia(nome)', '    nome: cadeia'), []);
      expect(r.status).toBe('erro_execucao');
      expect(r.erro.mensagem).toBe('O programa pediu mais dados do que os informados.');
    });

    it('valor vazio vira texto vazio em cadeia e erro em inteiro', async () => {
      const cadeia = await compilarEExecutar(motor, programa('    leia(nome)\n    escreva("[", nome, "]")', '    nome: cadeia'), ['']);
      expect(cadeia).toEqual({ status: 'ok', saida: '[]\n', erro: null });
      const inteiro = await compilarEExecutar(motor, programa('    leia(idade)', '    idade: inteiro'), ['']);
      expect(inteiro.status).toBe('erro_execucao');
      expect(inteiro.erro.mensagem).toBe('O valor digitado não é um número.');
    });

    it('o valor chega ao programa exatamente como digitado', async () => {
      const r = await compilarEExecutar(motor, programa('    leia(nome)\n    escreva("[", nome, "]")', '    nome: cadeia'), ['  Ana ']);
      expect(r.saida).toBe('[  Ana ]\n');
    });
  });
});

// Spec 010 (research R-07): real digitado com vírgula (P-2).
describe('leia de real com vírgula (spec 010)', () => {
  let motor;
  const ALTURA = programa('    leia(altura)\n    escreva(altura)', '    altura: real');

  beforeAll(async () => {
    motor = await criarMotorNode();
  });

  it('1,72 é recusado pelo Core, com a mensagem que lembra o ponto', async () => {
    const r = await compilarEExecutar(motor, ALTURA, ['1,72']);
    expect(r.status).toBe('erro_execucao');
    expect(r.erro.mensagem).toBe('O valor digitado não é um número. Use ponto para separar as casas decimais, por exemplo 1.72.');
  });

  it('1.72 funciona', async () => {
    await expect(compilarEExecutar(motor, ALTURA, ['1.72'])).resolves.toEqual({ status: 'ok', saida: '1.72\n', erro: null });
  });
});
