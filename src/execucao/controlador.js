// Controlador do clique em Executar e Parar (spec 009, contracts/executar.md; R-09, R-10).
// Decide o que acontece no clique e o que a Saída mostra, na ordem do FR-004. Recebe tudo
// por parâmetro (programa, executor, Saída, destaque do bloco), então não toca o DOM nem
// o Pyodide e é testável em Node.
// Spec 010 (contracts/entrada.md; research R-06, R-08): o leia pede o valor à Saída, com o
// nome e o tipo da variável do registro da 002; o valor confirmado vira linha 'entrada'.
import { criarDivisorLinhas } from './linhas.js';
import { MENSAGENS_EXECUCAO, relatoDoResultado } from './mensagens.js';
import { criarPedidoEntrada } from './entrada.js';
import { verificarExecucao } from '../portugol/execucao.js';

const MENSAGEM_GENERICA = 'O programa parou com um erro durante a execução.';

export function criarControladorExecucao({ obterPrograma, executor, saida, destacar, aoMudarEstado }) {
  let estadoAtual = 'ocioso';

  function mudarEstado(novo) {
    if (novo === estadoAtual) return;
    estadoAtual = novo;
    aoMudarEstado?.(novo);
  }

  function escreverItens(itens) {
    for (const item of itens) {
      if ('detalhe' in item) saida.escreverDetalhe(item.detalhe);
      else saida.escrever(item.texto, item.tipo);
    }
  }

  let emAndamento = null;

  function executar() {
    if (estadoAtual !== 'ocioso') return Promise.resolve();
    emAndamento = rodar().finally(() => {
      emAndamento = null;
    });
    return emAndamento;
  }

  async function rodar() {
    // O código fica fixo no clique: mudar os blocos depois não muda o que roda.
    const { codigo, avisos, variaveis = [] } = obterPrograma();

    saida.limpar();
    // Pendência da 008 (RF-08, R-09): com blocos incompletos, nada vai ao Core.
    const verificacao = verificarExecucao({ avisos });
    if (!verificacao.permitida) {
      saida.escrever(verificacao.motivo, 'erro');
      saida.mostrarAvisos(verificacao.avisos, (aviso) => destacar(aviso.blocoId));
      return;
    }
    const divisor = criarDivisorLinhas();
    // Fica false quando a execução termina (inclusive no Parar): um valor confirmado depois
    // disso não vai mais à Saída (História 2, research R-09).
    let ativa = true;
    const escreverLinhas = (linhas) => {
      if (linhas.length > 0) saida.escreverVarias(linhas, 'programa');
    };
    const comecarExecucao = () => {
      mudarEstado('executando');
      saida.escrever(MENSAGENS_EXECUCAO.executando, 'sistema');
    };

    if (executor.pronto()) {
      comecarExecucao();
    } else {
      mudarEstado('preparando');
      saida.escrever(MENSAGENS_EXECUCAO.preparando, 'sistema');
    }

    let resultado;
    try {
      resultado = await executor.executar(codigo, {
        aoProgresso: (etapa) =>
          saida.escrever(etapa === 'core' ? MENSAGENS_EXECUCAO.etapaCore : MENSAGENS_EXECUCAO.etapaPython, 'sistema'),
        aoPronto: comecarExecucao,
        aoEscrever: (texto) => escreverLinhas(divisor.acrescentar(texto)),
        aoPedirEntrada: async ({ variavel }) => {
          // Nenhuma linha fica retida no divisor enquanto o campo está aberto.
          escreverLinhas(divisor.finalizar());
          const valor = await saida.pedirEntrada(criarPedidoEntrada(variavel, variaveis));
          if (ativa) saida.escrever(valor, 'entrada');
          return valor;
        },
      });
    } catch {
      resultado = { status: 'erro_execucao', saida: '', erro: { mensagem: MENSAGEM_GENERICA } };
    }

    ativa = false;
    escreverLinhas(divisor.finalizar());
    saida.cancelarEntrada?.();
    escreverItens(relatoDoResultado(resultado, codigo));
    mudarEstado('ocioso');
  }

  // Parar (US3, FR-007): a execução pendente termina como "interrompido" e o fluxo de
  // executar() fecha a Saída e volta a ocioso. A promessa devolvida termina junto com ele,
  // para quem precisa esperar (ex.: Novo, antes de mostrar a orientação).
  function parar() {
    if (estadoAtual === 'ocioso') return Promise.resolve();
    executor.parar();
    return emAndamento ?? Promise.resolve();
  }

  return { executar, parar, estado: () => estadoAtual };
}
