// Entrada do worker_threads da aceitação (spec 009, research R-11): o mesmo serviço do
// worker do navegador, com o motor do Node (pacote npm pyodide + meupia-core real).
import { parentPort } from 'node:worker_threads';
import { criarServicoExecucao } from '../../../src/execucao/servico.js';
import { criarMotorNode } from './motor-node.js';

const servico = criarServicoExecucao({ criarMotor: criarMotorNode, postar: (m) => parentPort.postMessage(m) });
parentPort.on('message', (mensagem) => servico.receber(mensagem));
