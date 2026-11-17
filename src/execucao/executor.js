// Executor: lado da página do worker de execução (spec 009, contracts/executar.md; R-02, R-03).
// Cria o worker no primeiro uso, troca mensagens com ele e resolve cada execução com o
// resultado. O worker chega por criarWorker: o Worker do navegador ou, na aceitação, o
// adaptador de worker_threads. Não importa o Pyodide e não toca o DOM.
// Spec 010 (contracts/entrada.md): aoPedirEntrada liga o modo interativo; cada pedido_entrada
// é respondido com a mensagem entrada, só se a execução ainda for a mesma.
import { MENSAGEM_ERRO_AMBIENTE } from '../core/ambiente.js';

export function criarExecutor({ criarWorker }) {
  let worker = null;
  let estaPronto = false;
  let atual = null; // { id, resolver, aoEscrever, aoProgresso, aoPronto, aoPedirEntrada }
  let proximoId = 0;
  // Etapas que o worker anunciou antes de haver execução (preparo em segundo plano depois
  // do Parar): repetidas para a próxima execução mostrar o progresso inteiro.
  let etapasRecebidas = [];

  function concluir(resultado) {
    const execucao = atual;
    atual = null;
    execucao?.resolver(resultado);
  }

  function descartar() {
    worker?.terminate();
    worker = null;
    estaPronto = false;
  }

  function falhaAmbiente(mensagem) {
    descartar();
    concluir({ status: 'falha_ambiente', saida: '', erro: { mensagem } });
  }

  function tratar(origem, mensagem) {
    // Um worker já descartado (falha ou Parar) não fala mais com a página.
    if (origem !== worker || !mensagem) return;
    switch (mensagem.tipo) {
      case 'progresso':
        etapasRecebidas.push(mensagem.etapa);
        atual?.aoProgresso?.(mensagem.etapa);
        break;
      case 'pronto':
        estaPronto = true;
        atual?.aoPronto?.();
        break;
      case 'falha_ambiente':
        falhaAmbiente(mensagem.mensagem);
        break;
      case 'saida':
        if (atual && mensagem.id === atual.id) atual.aoEscrever?.(mensagem.texto);
        break;
      case 'pedido_entrada':
        if (atual && mensagem.id === atual.id) pedirEntrada(atual, origem, mensagem.variavel ?? null);
        break;
      case 'resultado':
        if (atual && mensagem.id === atual.id) concluir(mensagem.resultado);
        break;
      default:
        break;
    }
  }

  // O valor só vai ao worker se a execução e o worker ainda forem os mesmos (Parar no meio).
  async function pedirEntrada(execucao, origem, variavel) {
    if (!execucao.aoPedirEntrada) return;
    const valor = await execucao.aoPedirEntrada({ variavel });
    if (atual === execucao && worker === origem) {
      origem.postMessage({ tipo: 'entrada', id: execucao.id, valor: String(valor ?? '') });
    }
  }

  function novoWorker() {
    const criado = criarWorker();
    worker = criado;
    estaPronto = false;
    etapasRecebidas = [];
    criado.onmessage = (evento) => tratar(criado, evento.data);
    // O script do worker não carregou (ex.: sem rede): mesma mensagem do ambiente.
    criado.onerror = () => {
      if (criado === worker) falhaAmbiente(MENSAGEM_ERRO_AMBIENTE);
    };
    criado.postMessage({ tipo: 'preparar' });
  }

  function executar(codigo, { entrada = [], aoEscrever, aoProgresso, aoPronto, aoPedirEntrada } = {}) {
    if (!worker) novoWorker();
    proximoId += 1;
    const id = proximoId;
    if (!estaPronto) for (const etapa of etapasRecebidas) aoProgresso?.(etapa);
    return new Promise((resolver) => {
      atual = { id, resolver, aoEscrever, aoProgresso, aoPronto, aoPedirEntrada };
      worker.postMessage({ tipo: 'executar', id, codigo, entrada, interativo: Boolean(aoPedirEntrada) });
    });
  }

  // Parar (US3, R-03): terminate interrompe qualquer código, até um laço sem escreva. Um
  // worker novo já começa a se preparar, para a próxima execução não partir do zero.
  function parar() {
    if (!atual) return;
    descartar();
    concluir({ status: 'interrompido', saida: '', erro: null });
    novoWorker();
  }

  return { pronto: () => estaPronto, executar, parar };
}
