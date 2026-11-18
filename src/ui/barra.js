// Barra com o nome do programa e as ações (RF-01; spec 001, FR-002; contracts/tela.md).
// Spec 009 (contracts/tela-execucao.md): Executar habilitado e Parar logo depois dele; o
// estado dos dois segue o estado da execução (research R-10). Spec 011 (contracts/tela-salvar.md):
// Salvar ligado a aoSalvar. Carregar continua desabilitado até a spec 012 (index.html).
// Interface, fora da cobertura.

export function ligarBarra({ aoMudarNome, aoNovo, aoExecutar, aoParar, aoSalvar }) {
  document.getElementById('nome-programa').addEventListener('input', (evento) => {
    aoMudarNome(evento.target.value);
  });
  document.getElementById('botao-novo').addEventListener('click', () => aoNovo());
  document.getElementById('botao-executar').addEventListener('click', () => aoExecutar?.());
  document.getElementById('botao-parar').addEventListener('click', () => aoParar?.());
  document.getElementById('botao-salvar').addEventListener('click', () => aoSalvar?.());
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
