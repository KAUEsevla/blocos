// Serviço do worker de execução (spec 009, contracts/executar.md; research R-02, R-05, R-06).
// Roda dentro do worker: prepara o motor uma vez, executa o Portugol pelo adapter do Core e
// devolve a escrita em lotes. Não importa o Pyodide: o motor chega por criarMotor
// (criarMotorNavegador no navegador, criarMotorNode na aceitação).
// Spec 010 (contracts/entrada.md; research R-02, R-04, R-05): no modo interativo, um leia
// sem valor vira pedido_entrada; cada entrada reexecuta o programa compilado desde o
// começo, com todas as entradas, descartando a saída que a página já recebeu.
import { compilarEExecutar, continuarExecucao } from '../core/executor-core.js';
import { MENSAGEM_ERRO_AMBIENTE } from '../core/ambiente.js';

// O Python ocupa o worker durante a execução e timers não disparam: o lote é decidido
// pelo relógio a cada escrita (R-05).
const INTERVALO_LOTE_MS = 50;
const MENSAGEM_GENERICA = 'O programa parou com um erro durante a execução.';
const MOTIVO_DIVERGENCIA = 'A reexecução do programa produziu uma saída diferente da anterior.';

function erroGenerico(detalhe) {
  return {
    status: 'erro_execucao',
    saida: '',
    erro: { mensagem: MENSAGEM_GENERICA, etapa: 'execução', linha: null, coluna: null, detalhe },
  };
}

export function criarServicoExecucao({ criarMotor, postar, agora = () => Date.now() }) {
  let motorPromessa = null;
  // Execução à espera de um valor: { id, entrada, enviado, interativo } (data-model).
  let pendente = null;

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

  // Uma rodada do programa. `estado.enviado` é o texto que a página já recebeu: a rodada
  // confere esse prefixo e só envia o que vem depois (R-05).
  async function rodada(estado, chamar) {
    const { id } = estado;
    const prefixo = estado.enviado;
    let conferido = 0;
    let divergiu = false;

    let lote = '';
    let ultimoEnvio = agora();
    const enviar = () => {
      if (lote) postar({ tipo: 'saida', id, texto: lote });
      lote = '';
      ultimoEnvio = agora();
    };
    const aoEscrever = (texto) => {
      if (divergiu) return;
      let novo = String(texto);
      if (conferido < prefixo.length) {
        const parte = novo.slice(0, prefixo.length - conferido);
        if (parte !== prefixo.slice(conferido, conferido + parte.length)) {
          divergiu = true;
          return;
        }
        conferido += parte.length;
        novo = novo.slice(parte.length);
      }
      if (!novo) return;
      estado.enviado += novo;
      lote += novo;
      if (agora() - ultimoEnvio >= INTERVALO_LOTE_MS) enviar();
    };

    let resultado;
    try {
      resultado = await chamar({ aoEscrever, interativo: estado.interativo });
    } catch (erro) {
      resultado = erroGenerico(String(erro?.stack ?? erro));
    }
    if (divergiu || (conferido < prefixo.length && resultado.status !== 'erro_execucao')) {
      // A premissa de determinismo foi quebrada (R-02): erro em vez de Saída errada.
      lote = '';
      resultado = erroGenerico(MOTIVO_DIVERGENCIA);
    }
    enviar();

    if (resultado.status === 'aguardando_entrada') {
      pendente = estado;
      postar({ tipo: 'pedido_entrada', id, variavel: resultado.pedido?.variavel ?? null });
      return;
    }
    // A saída já chegou em lotes (contrato do protocolo).
    const { pedido: _pedido, ...final } = resultado;
    postar({ tipo: 'resultado', id, resultado: { ...final, saida: '' } });
  }

  async function executar({ id, codigo, entrada = [], interativo = false }) {
    pendente = null;
    let motor;
    try {
      motor = await preparar();
    } catch {
      return; // a falha já foi postada
    }
    const estado = { id, entrada: [...entrada], enviado: '', interativo: Boolean(interativo) };
    await rodada(estado, (opcoes) => compilarEExecutar(motor, codigo, estado.entrada, opcoes));
  }

  async function continuar({ id, valor }) {
    if (!pendente || pendente.id !== id) return;
    const estado = pendente;
    pendente = null;
    estado.entrada = [...estado.entrada, String(valor ?? '')];
    const motor = await preparar();
    await rodada(estado, (opcoes) => continuarExecucao(motor, estado.entrada, opcoes));
  }

  async function receber(mensagem) {
    if (mensagem?.tipo === 'preparar') {
      await preparar().catch(() => {});
    } else if (mensagem?.tipo === 'executar') {
      await executar(mensagem);
    } else if (mensagem?.tipo === 'entrada') {
      await continuar(mensagem);
    }
  }

  return { receber };
}
