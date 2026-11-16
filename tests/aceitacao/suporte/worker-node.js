// Adaptador de worker_threads no formato do Worker do navegador (spec 009, research R-11):
// { postMessage, terminate, onmessage, onerror }, para o executor real rodar no Node.
import { Worker } from 'node:worker_threads';

export function criarWorkerNode() {
  const worker = new Worker(new URL('./worker-node-entrada.js', import.meta.url));
  const adaptador = {
    onmessage: null,
    onerror: null,
    postMessage: (mensagem) => worker.postMessage(mensagem),
    terminate: () => worker.terminate(),
  };
  worker.on('message', (data) => adaptador.onmessage?.({ data }));
  worker.on('error', (erro) => adaptador.onerror?.(erro));
  return adaptador;
}
