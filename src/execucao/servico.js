// Serviço do worker de execução (spec 009, contracts/executar.md; research R-02, R-05, R-06).
// Roda dentro do worker: prepara o motor uma vez, executa o Portugol pelo adapter do Core e
// devolve a escrita em lotes. Não importa o Pyodide: o motor chega por criarMotor
// (criarMotorNavegador no navegador, criarMotorNode na aceitação).
import { compilarEExecutar } from '../core/executor-core.js';
import { MENSAGEM_ERRO_AMBIENTE } from '../core/ambiente.js';

// O Python ocupa o worker durante a execução e timers não disparam: o lote é decidido
// pelo relógio a cada escrita (R-05).
const INTERVALO_LOTE_MS = 50;
const MENSAGEM_GENERICA = 'O programa parou com um erro durante a execução.';

export function criarServicoExecucao({ criarMotor, postar, agora = () => Date.now() }) {
  let motorPromessa = null;

  function preparar() {
    if (!motorPromessa) {
      motorPromessa = Promise.resolve()
        .then(() => criarMotor({ aoProgresso: (etapa) => postar({ tipo: 'progresso', etapa }) }))
        .then(
          (motor) => {
            postar({ tipo: 'pronto' });
            return motor;
          },
          (erro) => {
            // Uma nova tentativa recria o motor (caso de borda "sem internet").
            motorPromessa = null;
            postar({ tipo: 'falha_ambiente', mensagem: erro?.name === 'ErroAmbiente' ? erro.message : MENSAGEM_ERRO_AMBIENTE });
            throw erro;
          },
        );
    }
    return motorPromessa;
  }

  async function executar({ id, codigo, entrada = [] }) {
    let motor;
    try {
      motor = await preparar();
    } catch {
      return; // a falha já foi postada
    }

    let lote = '';
    let ultimoEnvio = agora();
    const enviar = () => {
      if (lote) postar({ tipo: 'saida', id, texto: lote });
      lote = '';
      ultimoEnvio = agora();
    };
    const aoEscrever = (texto) => {
      lote += texto;
      if (agora() - ultimoEnvio >= INTERVALO_LOTE_MS) enviar();
    };

    let resultado;
    try {
      resultado = await compilarEExecutar(motor, codigo, entrada, { aoEscrever });
    } catch (erro) {
      resultado = {
        status: 'erro_execucao',
        saida: '',
        erro: {
          mensagem: MENSAGEM_GENERICA,
          etapa: 'execução',
          linha: null,
          coluna: null,
          detalhe: String(erro?.stack ?? erro),
        },
      };
    }
    enviar();
    // A saída já chegou em lotes (contrato do protocolo).
    postar({ tipo: 'resultado', id, resultado: { ...resultado, saida: '' } });
  }

  async function receber(mensagem) {
    if (mensagem?.tipo === 'preparar') {
      await preparar().catch(() => {});
    } else if (mensagem?.tipo === 'executar') {
      await executar(mensagem);
    }
  }

  return { receber };
}
