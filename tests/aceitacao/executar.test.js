// Execução pela tela no Core real (spec 009, research R-11): executor e serviço reais, com o
// Pyodide e o meupia-core dentro de um worker_threads do Node. Prova a Saída da tela (lotes
// do worker + divisor de linhas); o adapter sozinho é provado em adapter-core.test.js.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { criarExecutor } from '../../src/execucao/executor.js';
import { criarDivisorLinhas } from '../../src/execucao/linhas.js';
import { relatoDoResultado } from '../../src/execucao/mensagens.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { criarWorkerNode } from './suporte/worker-node.js';

const PASTA = join(import.meta.dirname, 'casos');
const casos = readdirSync(PASTA)
  .filter((nome) => nome.endsWith('.json'))
  .sort()
  .map((arquivo) => ({ arquivo, caso: JSON.parse(readFileSync(join(PASTA, arquivo), 'utf8')) }));
const OLA_MUNDO = casos.find(({ arquivo }) => arquivo === 'escreva-ola-mundo.json').caso.portugolEsperado;

// Linhas como a Saída da tela as mostra: pedaços → divisor de linhas.
function linhasDe(pedacos) {
  const divisor = criarDivisorLinhas();
  const linhas = pedacos.flatMap((p) => divisor.acrescentar(p));
  return [...linhas, ...divisor.finalizar()];
}

const programa = (corpo, variaveis = '') =>
  `algoritmo "Teste"\n\n${variaveis ? `var\n${variaveis}\n\n` : ''}inicio\n${corpo}\nfim_algoritmo\n`;

async function executarColetando(executor, codigo, entrada = []) {
  const pedacos = [];
  const resultado = await executor.executar(codigo, { entrada, aoEscrever: (t) => pedacos.push(t) });
  return { resultado, pedacos };
}

describe('execução pela tela no Core real (worker_threads)', () => {
  const workers = [];
  let executor;

  beforeAll(async () => {
    executor = criarExecutor({
      criarWorker: () => {
        const w = criarWorkerNode();
        workers.push(w);
        return w;
      },
    });
    // Prepara o ambiente: as medições abaixo são "depois do ambiente pronto".
    await executor.executar(OLA_MUNDO);
  });

  afterAll(async () => {
    await Promise.all(workers.map((w) => w.terminate()));
  });

  it('"Olá, mundo!" chega em fluxo e termina com ok', async () => {
    const { resultado, pedacos } = await executarColetando(executor, OLA_MUNDO);
    expect(resultado.status).toBe('ok');
    expect(pedacos.join('')).toBe('Olá, mundo!\n');
    expect(linhasDe(pedacos)).toEqual(['Olá, mundo!']);
  });

  it('SC-002: com o ambiente pronto, o resultado chega em menos de 2 s', async () => {
    const inicio = performance.now();
    const { resultado } = await executarColetando(executor, OLA_MUNDO);
    const duracao = performance.now() - inicio;
    expect(resultado.status).toBe('ok');
    expect(duracao).toBeLessThan(2000);
  });

  // US2 (cenários 1 e 2): erros distinguidos, linhas anteriores visíveis, rastro no detalhe.
  it('divisão por zero preserva as linhas anteriores e traz o rastro no detalhe', async () => {
    const codigo = 'algoritmo "X"\n\ninicio\n    escreva("antes")\n    escreva(1 / 0)\nfim_algoritmo\n';
    const { resultado, pedacos } = await executarColetando(executor, codigo);
    expect(resultado.status).toBe('erro_execucao');
    expect(pedacos.join('')).toBe('antes\n');
    expect(resultado.erro.mensagem).toBe('Não é possível dividir por zero.');
    expect(resultado.erro.detalhe).toContain('Traceback');
    expect(relatoDoResultado(resultado, codigo).map((i) => i.texto ?? 'detalhe')).toEqual([
      'Erro de execução',
      'Não é possível dividir por zero.',
      'detalhe',
    ]);
  });

  it('erro de compilação aponta a linha do Portugol', async () => {
    // Texto escrito à mão: o gerador nunca produz Portugol inválido (princípio II).
    const codigo = 'algoritmo "X"\n\ninicio\n    se verdadeiro\n        escreva("x")\n    fim_se\nfim_algoritmo\n';
    const { resultado, pedacos } = await executarColetando(executor, codigo);
    expect(resultado.status).toBe('erro_compilacao');
    expect(pedacos).toEqual([]);
    expect(resultado.erro.linha).toBeGreaterThan(0);
    const itens = relatoDoResultado(resultado, codigo);
    expect(itens[0]).toEqual({ texto: 'Erro de compilação', tipo: 'erro' });
    expect(itens.some((i) => i.texto?.startsWith(`Linha ${resultado.erro.linha}: `))).toBe(true);
  });

  // US3 (FR-007): o bloco enquanto é da 005, então o laço é escrito à mão (research R-11, R-14).
  it('Parar interrompe um enquanto infinito, e a execução seguinte funciona', async () => {
    const infinito =
      'algoritmo "Infinito"\n\nvar\n    i: inteiro\n\ninicio\n    i <- 0\n' +
      '    enquanto verdadeiro faca\n        i <- i + 1\n        escreva(i)\n    fim_enquanto\nfim_algoritmo\n';
    const pedacos = [];
    let aoSegundoLote;
    const doisLotes = new Promise((resolver) => {
      aoSegundoLote = resolver;
    });
    const execucao = executor.executar(infinito, {
      aoEscrever: (texto) => {
        pedacos.push(texto);
        if (pedacos.length === 2) aoSegundoLote();
      },
    });
    // Dois lotes provam que a Saída chega em fluxo, antes do fim (R-05).
    await doisLotes;
    executor.parar();
    await expect(execucao).resolves.toEqual({ status: 'interrompido', saida: '', erro: null });
    const linhas = linhasDe(pedacos);
    expect(linhas.slice(0, 3)).toEqual(['1', '2', '3']);

    const { resultado, pedacos: depois } = await executarColetando(executor, OLA_MUNDO);
    expect(resultado.status).toBe('ok');
    expect(depois.join('')).toBe('Olá, mundo!\n');
  });

  it('mais de 1.000 linhas chegam inteiras e na ordem', async () => {
    const corpo = Array.from({ length: 1500 }, (_, i) => `    escreva(${i + 1})`).join('\n');
    const codigo = `algoritmo "MuitasLinhas"\n\ninicio\n${corpo}\nfim_algoritmo\n`;
    const { resultado, pedacos } = await executarColetando(executor, codigo);
    expect(resultado.status).toBe('ok');
    expect(linhasDe(pedacos)).toEqual(Array.from({ length: 1500 }, (_, i) => String(i + 1)));
  });

  // Spec 010 (contracts/entrada.md): leia interativo no worker real.
  it('entrada interativa: leia(nome) com "Ana" mostra "Oi, Ana"', async () => {
    const codigo = programa('    leia(nome)\n    escreva("Oi, ", nome)', '    nome: cadeia');
    const pedidos = [];
    const pedacos = [];
    const resultado = await executor.executar(codigo, {
      aoEscrever: (t) => pedacos.push(t),
      aoPedirEntrada: async ({ variavel }) => {
        pedidos.push(variavel);
        return 'Ana';
      },
    });
    expect(resultado.status).toBe('ok');
    expect(pedidos).toEqual(['nome']);
    expect(linhasDe(pedacos)).toEqual(['Oi, Ana']);
  });

  it('três leia seguidos pedem nome, idade e altura, um de cada vez e na ordem', async () => {
    const codigo = programa(
      '    leia(nome)\n    escreva(nome)\n    leia(idade)\n    escreva(idade)\n    leia(altura)\n    escreva(altura)',
      '    nome: cadeia\n    idade: inteiro\n    altura: real',
    );
    const valores = { nome: 'Ana', idade: '15', altura: '1.72' };
    const pedidos = [];
    let abertos = 0;
    const pedacos = [];
    const resultado = await executor.executar(codigo, {
      aoEscrever: (t) => pedacos.push(t),
      aoPedirEntrada: async ({ variavel }) => {
        abertos += 1;
        expect(abertos).toBe(1); // um pedido de cada vez
        pedidos.push(variavel);
        await new Promise((r) => setTimeout(r, 5));
        abertos -= 1;
        return valores[variavel];
      },
    });
    expect(resultado.status).toBe('ok');
    expect(pedidos).toEqual(['nome', 'idade', 'altura']);
    expect(linhasDe(pedacos)).toEqual(['Ana', '15', '1.72']);
  });

  it('um leia num enquanto pede a cada volta, sem repetir linhas', async () => {
    // Portugol em texto: os blocos de repetição são da spec 005.
    const codigo = programa(
      '    escreva("antes")\n    enquanto i < 2 faca\n        leia(nome)\n        escreva("Oi, ", nome)\n        i <- i + 1\n    fim_enquanto',
      '    nome: cadeia\n    i: inteiro',
    );
    const fila = ['Ana', 'Bia'];
    const pedidos = [];
    const pedacos = [];
    const resultado = await executor.executar(codigo, {
      aoEscrever: (t) => pedacos.push(t),
      aoPedirEntrada: async ({ variavel }) => {
        pedidos.push(variavel);
        return fila.shift();
      },
    });
    expect(resultado.status).toBe('ok');
    expect(pedidos).toEqual(['nome', 'nome']);
    expect(linhasDe(pedacos)).toEqual(['antes', 'Oi, Ana', 'Oi, Bia']);
  });

  // SC-001 da 010: os casos com leia, com as entradas fornecidas uma a uma no modo interativo.
  const casosComLeia = casos.filter(({ caso }) => caso.entrada.length > 0 && (caso.statusEsperado ?? 'ok') === 'ok');

  it('há casos de aceitação com leia para o SC-001 interativo', () => {
    expect(casosComLeia.length).toBeGreaterThanOrEqual(2);
  });

  describe.each(casosComLeia)('SC-001 (010): $arquivo com entrada interativa', ({ caso }) => {
    it(caso.descricao, async () => {
      const { codigo } = gerarPortugol(caso.projeto);
      const fila = [...caso.entrada];
      const pedacos = [];
      const resultado = await executor.executar(codigo, {
        aoEscrever: (t) => pedacos.push(t),
        aoPedirEntrada: async () => fila.shift(),
      });
      expect(resultado.status).toBe('ok');
      expect(fila).toEqual([]);
      expect(linhasDe(pedacos)).toEqual(linhasDe([caso.saidaEsperada]));
    });
  });

  describe.each(casos)('SC-001: a Saída da tela de $arquivo é igual à esperada', ({ caso }) => {
    it(caso.descricao, async () => {
      const { codigo } = gerarPortugol(caso.projeto);
      const { resultado, pedacos } = await executarColetando(executor, codigo, caso.entrada);
      expect(resultado.status).toBe(caso.statusEsperado ?? 'ok');
      expect(linhasDe(pedacos)).toEqual(linhasDe([caso.saidaEsperada]));
    });
  });
});
