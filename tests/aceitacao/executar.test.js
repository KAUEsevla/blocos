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

  describe.each(casos)('SC-001: a Saída da tela de $arquivo é igual à esperada', ({ caso }) => {
    it(caso.descricao, async () => {
      const { codigo } = gerarPortugol(caso.projeto);
      const { resultado, pedacos } = await executarColetando(executor, codigo, caso.entrada);
      expect(resultado.status).toBe(caso.statusEsperado ?? 'ok');
      expect(linhasDe(pedacos)).toEqual(linhasDe([caso.saidaEsperada]));
    });
  });
});
