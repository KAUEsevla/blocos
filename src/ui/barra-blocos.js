// Botões Desfazer e Refazer do cabeçalho do painel Blocos (RF-07; spec 007, FR-006;
// contracts/editor.md). Interface, fora da cobertura.

export function ligarBotoesDesfazer({ aoDesfazer, aoRefazer }) {
  document.getElementById('botao-desfazer').addEventListener('click', () => aoDesfazer());
  document.getElementById('botao-refazer').addEventListener('click', () => aoRefazer());
}

export function atualizarBotoesDesfazer({ podeDesfazer, podeRefazer }) {
  document.getElementById('botao-desfazer').disabled = !podeDesfazer;
  document.getElementById('botao-refazer').disabled = !podeRefazer;
}
