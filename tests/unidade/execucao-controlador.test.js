// Controlador do clique em Executar e Parar (spec 009, contracts/executar.md; R-09, R-10).
import { describe, it, expect, vi } from 'vitest';
import { criarControladorExecucao } from '../../src/execucao/controlador.js';

const PREPARANDO = 'Preparando o ambiente do meuPiá. Na primeira vez isso pode levar até 30 segundos.';

// Saída falsa: registra as chamadas em ordem.
function saidaFalsa() {
  const chamadas = [];
  return {
    chamadas,
    limpar: () => chamadas.push(['limpar']),
    escrever: (texto, tipo) => chamadas.push(['escrever', texto, tipo]),
    escreverVarias: (linhas, tipo) => chamadas.push(['escreverVarias', [...linhas], tipo]),
    escreverDetalhe: (texto) => chamadas.push(['escreverDetalhe', texto]),
    mostrarAvisos: (avisos, aoClicar) => chamadas.push(['mostrarAvisos', avisos, aoClicar]),
  };
}

// Executor falso: o teste decide o roteiro (etapas, pedaços e resultado).
function executorFalso({ pronto = false, roteiro } = {}) {
  let estaPronto = pronto;
  const executor = {
    pronto: () => estaPronto,
    executar: vi.fn(async (codigo, opcoes) => {
      if (roteiro) return roteiro(opcoes, codigo);
      if (!estaPronto) {
        opcoes.aoProgresso?.('python');
        opcoes.aoProgresso?.('core');
        estaPronto = true;
        opcoes.aoPronto?.();
      }
      return { status: 'ok', saida: '', erro: null };
    }),
    parar: vi.fn(),
  };
  return executor;
}

function montar({ executor = executorFalso(), programa = { codigo: 'COD', avisos: [] } } = {}) {
  const saida = saidaFalsa();
  const estados = [];
  const destacar = vi.fn();
  const obterPrograma = vi.fn(() => programa);
  const controlador = criarControladorExecucao({
    obterPrograma,
    executor,
    saida,
    destacar,
    aoMudarEstado: (estado) => estados.push(estado),
  });
  return { controlador, saida, estados, destacar, executor, obterPrograma };
}

describe('bloqueio por blocos incompletos (pendência da 008)', () => {
  const avisos = [
    { blocoId: 'b1', tipoBloco: 'escreva', encaixe: 'VALOR1', mensagem: 'Falta o valor do bloco escreva' },
    { blocoId: 'b2', tipoBloco: 'variavel_recebe', encaixe: 'VALOR', mensagem: 'Falta o valor do bloco recebe' },
  ];

  it('não chama o executor, mostra o motivo e os avisos na ordem, e continua ocioso', async () => {
    const { controlador, saida, estados, executor } = montar({ programa: { codigo: 'COD ???', avisos } });
    await controlador.executar();
    expect(executor.executar).not.toHaveBeenCalled();
    expect(estados).toEqual([]);
    expect(controlador.estado()).toBe('ocioso');
    expect(saida.chamadas.map((c) => (c[0] === 'mostrarAvisos' ? c.slice(0, 2) : c))).toEqual([
      ['limpar'],
      ['escrever', 'O programa tem blocos incompletos. Complete-os para executar.', 'erro'],
      ['mostrarAvisos', avisos],
    ]);
  });

  it('clicar no segundo aviso destaca o bloco dele', async () => {
    const { controlador, saida, destacar } = montar({ programa: { codigo: 'COD', avisos } });
    await controlador.executar();
    const [, avisosMostrados, aoClicar] = saida.chamadas.find((c) => c[0] === 'mostrarAvisos');
    aoClicar(avisosMostrados[1]);
    expect(destacar).toHaveBeenCalledWith('b2');
  });

  it('sem avisos, o fluxo da US1 segue normal', async () => {
    const { controlador, executor } = montar({ programa: { codigo: 'COD', avisos: [] } });
    await controlador.executar();
    expect(executor.executar).toHaveBeenCalledTimes(1);
  });
});

describe('criarControladorExecucao: rodar e ver (US1)', () => {
  it('primeira execução: preparando → executando → ocioso, e a Saída na ordem do FR-004', async () => {
    const executor = executorFalso({
      roteiro: async (opcoes) => {
        opcoes.aoProgresso('python');
        opcoes.aoProgresso('core');
        opcoes.aoPronto();
        opcoes.aoEscrever('Olá, mundo!');
        opcoes.aoEscrever('\n');
        return { status: 'ok', saida: '', erro: null };
      },
    });
    const { controlador, saida, estados } = montar({ executor });
    await controlador.executar();
    expect(estados).toEqual(['preparando', 'executando', 'ocioso']);
    expect(saida.chamadas).toEqual([
      ['limpar'],
      ['escrever', PREPARANDO, 'sistema'],
      ['escrever', 'Carregando o Python (1 de 2)...', 'sistema'],
      ['escrever', 'Instalando o meuPiá Core (2 de 2)...', 'sistema'],
      ['escrever', 'Executando...', 'sistema'],
      ['escreverVarias', ['Olá, mundo!'], 'programa'],
      ['escrever', 'Fim do programa', 'sistema'],
    ]);
    expect(controlador.estado()).toBe('ocioso');
  });

  it('com o ambiente pronto: só executando → ocioso, sem a mensagem preparando', async () => {
    const { controlador, saida, estados } = montar({ executor: executorFalso({ pronto: true }) });
    await controlador.executar();
    expect(estados).toEqual(['executando', 'ocioso']);
    expect(saida.chamadas.map((c) => c[1])).not.toContain(PREPARANDO);
    expect(saida.chamadas[1]).toEqual(['escrever', 'Executando...', 'sistema']);
  });

  it('pedaço sem \\n no fim é escrito antes de Fim do programa', async () => {
    const executor = executorFalso({
      pronto: true,
      roteiro: async (opcoes) => {
        opcoes.aoEscrever('a\nb');
        return { status: 'ok', saida: '', erro: null };
      },
    });
    const { controlador, saida } = montar({ executor });
    await controlador.executar();
    expect(saida.chamadas.slice(2)).toEqual([
      ['escreverVarias', ['a'], 'programa'],
      ['escreverVarias', ['b'], 'programa'],
      ['escrever', 'Fim do programa', 'sistema'],
    ]);
  });

  it('programa sem saída mostra Executando... e Fim do programa', async () => {
    const { controlador, saida } = montar({ executor: executorFalso({ pronto: true }) });
    await controlador.executar();
    expect(saida.chamadas).toEqual([
      ['limpar'],
      ['escrever', 'Executando...', 'sistema'],
      ['escrever', 'Fim do programa', 'sistema'],
    ]);
  });

  it('um segundo executar durante a execução é ignorado (FR-006)', async () => {
    let terminar;
    const executor = executorFalso({
      pronto: true,
      roteiro: () =>
        new Promise((resolver) => {
          terminar = () => resolver({ status: 'ok', saida: '', erro: null });
        }),
    });
    const { controlador } = montar({ executor });
    const primeira = controlador.executar();
    await controlador.executar();
    expect(controlador.estado()).toBe('executando');
    expect(executor.executar).toHaveBeenCalledTimes(1);
    terminar();
    await primeira;
    expect(controlador.estado()).toBe('ocioso');
  });

  it('executa o código lido no clique, mesmo que os blocos mudem depois (FR-001)', async () => {
    const programa = { codigo: 'NO CLIQUE', avisos: [] };
    let codigoRecebido;
    const executor = executorFalso({
      pronto: true,
      roteiro: async (_opcoes, codigo) => {
        programa.codigo = 'DEPOIS';
        codigoRecebido = codigo;
        return { status: 'ok', saida: '', erro: null };
      },
    });
    const { controlador, obterPrograma } = montar({ executor, programa });
    await controlador.executar();
    expect(obterPrograma).toHaveBeenCalledTimes(1);
    expect(codigoRecebido).toBe('NO CLIQUE');
  });

  it('falha do ambiente escreve a mensagem como erro e volta a ocioso', async () => {
    const mensagem = 'Não foi possível carregar o ambiente do meuPiá. Verifique a conexão e tente de novo.';
    const executor = executorFalso({
      roteiro: async () => ({ status: 'falha_ambiente', saida: '', erro: { mensagem } }),
    });
    const { controlador, saida, estados } = montar({ executor });
    await controlador.executar();
    expect(saida.chamadas.at(-1)).toEqual(['escrever', mensagem, 'erro']);
    expect(estados.at(-1)).toBe('ocioso');
  });

  it('erro de execução: linhas anteriores, depois o relato; detalhe só por escreverDetalhe (US2, SC-004)', async () => {
    const executor = executorFalso({
      pronto: true,
      roteiro: async (opcoes) => {
        opcoes.aoEscrever('um\ndois\n');
        return {
          status: 'erro_execucao',
          saida: '',
          erro: { mensagem: 'Não é possível dividir por zero.', detalhe: 'Traceback: ZeroDivisionError' },
        };
      },
    });
    const { controlador, saida } = montar({ executor });
    await controlador.executar();
    expect(saida.chamadas.slice(1)).toEqual([
      ['escrever', 'Executando...', 'sistema'],
      ['escreverVarias', ['um', 'dois'], 'programa'],
      ['escrever', 'Erro de execução', 'erro'],
      ['escrever', 'Não é possível dividir por zero.', 'erro'],
      ['escreverDetalhe', 'Traceback: ZeroDivisionError'],
    ]);
    const escritos = saida.chamadas.filter((c) => c[0] === 'escrever').map((c) => c[1]);
    expect(escritos.join('\n')).not.toContain('Traceback');
  });

  it('exceção inesperada do executor termina com Erro de execução genérico e volta a ocioso', async () => {
    const executor = executorFalso({
      pronto: true,
      roteiro: async () => {
        throw new Error('inesperado');
      },
    });
    const { controlador, saida, estados } = montar({ executor });
    await controlador.executar();
    expect(saida.chamadas.slice(-2)).toEqual([
      ['escrever', 'Erro de execução', 'erro'],
      ['escrever', 'O programa parou com um erro durante a execução.', 'erro'],
    ]);
    expect(estados.at(-1)).toBe('ocioso');
  });
});
