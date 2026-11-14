// Barra com o nome do programa e as ações (RF-01; spec 001, FR-002; contracts/tela.md).
// Executar, Salvar e Carregar ficam desabilitados até as specs 009, 011 e 012 (research R-10);
// o estado deles está no index.html. Não há botão Parar aqui (é da 009). Interface, fora da cobertura.

export function ligarBarra({ aoMudarNome, aoNovo }) {
  document.getElementById('nome-programa').addEventListener('input', (evento) => {
    aoMudarNome(evento.target.value);
  });
  document.getElementById('botao-novo').addEventListener('click', () => aoNovo());
}

// Escreve no campo sem disparar aoMudarNome (atribuir value não gera o evento input).
export function definirNome(nome) {
  document.getElementById('nome-programa').value = nome;
}
