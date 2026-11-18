// Barra com o nome do programa e as ações (RF-01; spec 001, FR-002; contracts/tela.md).
// Spec 009 (contracts/tela-execucao.md): Executar habilitado e Parar logo depois dele; o
// estado dos dois segue o estado da execução (research R-10). Spec 011 (contracts/tela-salvar.md):
// Salvar ligado a aoSalvar. Spec 012 (contracts/tela-carregar.md): Carregar ligado a aoCarregar.
// Interface, fora da cobertura.

import { TEXTOS } from './textos.js';

export function ligarBarra({ aoMudarNome, aoNovo, aoExecutar, aoParar, aoSalvar, aoCarregar }) {
  document.getElementById('nome-programa').addEventListener('input', (evento) => {
    aoMudarNome(evento.target.value);
  });
  document.getElementById('botao-novo').addEventListener('click', () => aoNovo());
  document.getElementById('botao-executar').addEventListener('click', () => aoExecutar?.());
  document.getElementById('botao-parar').addEventListener('click', () => aoParar?.());
  document.getElementById('botao-salvar').addEventListener('click', () => aoSalvar?.());
  document.getElementById('botao-carregar').addEventListener('click', () => aoCarregar?.());
}

// Executar `disabled` fora do `ocioso`; Parar `disabled` no `ocioso`.
export function mostrarEstadoExecucao(estado) {
  const ocioso = estado === 'ocioso';
  document.getElementById('botao-executar').disabled = !ocioso;
  document.getElementById('botao-parar').disabled = ocioso;
}

// Escreve no campo sem disparar aoMudarNome (atribuir value não gera o evento input).
export function definirNome(nome) {
  document.getElementById('nome-programa').value = nome;
}

// Indicação "alterações não salvas" ao lado do nome (spec 011, FR-006).
export function mostrarAlteracoes(alterado) {
  const indicador = document.getElementById('indicador-alteracoes');
  indicador.textContent = alterado ? TEXTOS.alteracoesNaoSalvas : '';
  indicador.hidden = !alterado;
}
