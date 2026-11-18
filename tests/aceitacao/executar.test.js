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
import { criarControladorExecucao } from '../../src/execucao/controlador.js';
import {
  projetoMilEQuinhentas,
  projetoInfinito,
  projetoLeiaInfinito,
  projetoLeiaNoPara,
  projetoPassoVariavelZero,
  projetoPassoFixoZero,
} from './suporte/projetos-repeticao.js';

// Portugol de um projeto em blocos montável no editor: sem avisos (spec 005, research R-11).
function semAvisos(projeto) {
  const { codigo, avisos } = gerarPortugol(projeto);
  expect(avisos).toEqual([]);
  return codigo;
}

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

  // US3 (FR-007) da 009; pendência P-2 conferida com os blocos da 005 (research R-11).
  it('Parar interrompe um enquanto infinito, e a execução seguinte funciona', async () => {
    const infinito = semAvisos(projetoInfinito());
    expect(infinito).toContain('    enquanto verdadeiro faca\n');
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

  // Pendência P-2 da 009, conferida com os blocos da 005 (research R-11): um para de 1 a 1500.
  it('mais de 1.000 linhas chegam inteiras e na ordem', async () => {
    const codigo = semAvisos(projetoMilEQuinhentas());
    expect(codigo).toContain('    para i de 1 ate 1500 faca\n');
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

  // Pendência P-3 da 010, conferida com os blocos da 005 (research R-11).
  it('um leia num para pede a cada volta, sem repetir linhas', async () => {
    const codigo = semAvisos(projetoLeiaNoPara());
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
    expect(linhasDe(pedacos)).toEqual(['Oi, Ana', 'Oi, Bia']);
  });

  // Pendência P-3 da 010, conferida com os blocos da 005 (research R-11): Parar com o pedido
  // aberto dentro de um laço infinito.
  it('Parar com o pedido aberto num enquanto interrompe, e a execução seguinte funciona', async () => {
    const codigo = semAvisos(projetoLeiaInfinito());
    const pedidos = [];
    let avisarSegundo;
    const segundoPedido = new Promise((r) => (avisarSegundo = r));
    const execucao = executor.executar(codigo, {
      aoPedirEntrada: ({ variavel }) => {
        pedidos.push(variavel);
        if (pedidos.length === 1) return Promise.resolve('Ana');
        avisarSegundo();
        return new Promise(() => {}); // o estudante nunca confirma o segundo
      },
    });
    await segundoPedido;
    executor.parar();
    await expect(execucao).resolves.toEqual({ status: 'interrompido', saida: '', erro: null });
    expect(pedidos).toEqual(['nome', 'nome']);

    const { resultado, pedacos } = await executarColetando(executor, OLA_MUNDO);
    expect(resultado.status).toBe('ok');
    expect(pedacos.join('')).toBe('Olá, mundo!\n');
  });

  // Spec 005 (research R-08): passo numa variável que vale 0, que o editor não vê antes.
  it('passo numa variável que vale 0 dá erro de execução em pt-BR', async () => {
    const { resultado } = await executarColetando(executor, semAvisos(projetoPassoVariavelZero()));
    expect(resultado.status).toBe('erro_execucao');
    expect(resultado.erro.mensagem).toBe('O passo do para ficou zero: o laço nunca terminaria.');
  });

  // SC-002 da 005 (analyze C1): passo fixo zero nunca chega ao Core; o controlador da 009 bloqueia.
  it('passo fixo zero: o controlador bloqueia Executar e não chama o executor', async () => {
    const programaGerado = gerarPortugol(projetoPassoFixoZero());
    expect(programaGerado.avisos.map((a) => a.mensagem)).toEqual([
      'O passo do bloco para não pode ser zero: o laço nunca terminaria',
    ]);
    const chamadas = [];
    const saida = {
      limpar: () => chamadas.push('limpar'),
      escrever: (texto, tipo) => chamadas.push([tipo, texto]),
      escreverVarias: () => chamadas.push('linhas'),
      escreverDetalhe: () => chamadas.push('detalhe'),
      mostrarAvisos: (avisos) => chamadas.push(['avisos', avisos.map((a) => a.mensagem)]),
    };
    let chamouExecutor = false;
    const espiao = {
      pronto: () => true,
      executar: () => {
        chamouExecutor = true;
        return Promise.resolve({ status: 'ok', saida: '', erro: null });
      },
      parar: () => {},
    };
    const controlador = criarControladorExecucao({
      obterPrograma: () => ({ codigo: programaGerado.codigo, avisos: programaGerado.avisos }),
      executor: espiao,
      saida,
      destacar: () => {},
    });
    await controlador.executar();
    expect(chamouExecutor).toBe(false);
    expect(chamadas[0]).toBe('limpar');
    expect(chamadas[1][0]).toBe('erro');
    expect(chamadas[2]).toEqual(['avisos', ['O passo do bloco para não pode ser zero: o laço nunca terminaria']]);
  });

  it('Parar com o pedido aberto interrompe, e a execução seguinte funciona', async () => {
    const codigo = programa('    leia(nome)\n    escreva(nome)', '    nome: cadeia');
    let avisar;
    const pedido = new Promise((r) => (avisar = r));
    const execucao = executor.executar(codigo, {
      aoPedirEntrada: () => {
        avisar();
        return new Promise(() => {}); // o estudante nunca confirma
      },
    });
    await pedido;
    executor.parar();
    await expect(execucao).resolves.toEqual({ status: 'interrompido', saida: '', erro: null });

    const { resultado, pedacos } = await executarColetando(executor, OLA_MUNDO);
    expect(resultado.status).toBe('ok');
    expect(pedacos.join('')).toBe('Olá, mundo!\n');
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
