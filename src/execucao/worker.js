// Worker de execução do navegador (spec 009, research R-02). Cola de navegador, fora da
// cobertura (vite.config.js) e verificada no quickstart: liga as mensagens ao serviço,
// com o motor do navegador (Pyodide do CDN + meupia-core).
import { criarServicoExecucao } from './servico.js';
import { criarMotorNavegador } from '../core/motor-navegador.js';

const servico = criarServicoExecucao({ criarMotor: criarMotorNavegador, postar: (m) => self.postMessage(m) });
self.onmessage = (evento) => servico.receber(evento.data);
