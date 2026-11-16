// Execução pela tela no Core real (spec 009, research R-11): executor e serviço reais, com o
// Pyodide e o meupia-core dentro de um worker_threads do Node. Prova a Saída da tela (lotes
// do worker + divisor de linhas); o adapter sozinho é provado em adapter-core.test.js.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { criarExecutor } from '../../src/execucao/executor.js';
import { criarDivisorLinhas } from '../../src/execucao/linhas.js';
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

  describe.each(casos)('SC-001: a Saída da tela de $arquivo é igual à esperada', ({ caso }) => {
    it(caso.descricao, async () => {
      const { codigo } = gerarPortugol(caso.projeto);
      const { resultado, pedacos } = await executarColetando(executor, codigo, caso.entrada);
      expect(resultado.status).toBe(caso.statusEsperado ?? 'ok');
      expect(linhasDe(pedacos)).toEqual(linhasDe([caso.saidaEsperada]));
    });
  });
});
