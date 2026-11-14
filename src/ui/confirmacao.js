// Diálogo de confirmação com botões em pt-BR (RF-01, RNF-03; contracts/tela.md; research R-04).
// Substitui o window.confirm, cujos botões seguem o idioma do navegador. Interface, fora da cobertura.

export function confirmar({ titulo, mensagem, confirmar: rotuloConfirmar, cancelar: rotuloCancelar }) {
  const dialogo = document.getElementById('dialogo-confirmacao');
  const botaoConfirmar = document.getElementById('dialogo-confirmar');
  const botaoCancelar = document.getElementById('dialogo-cancelar');

  document.getElementById('dialogo-titulo').textContent = titulo;
  document.getElementById('dialogo-mensagem').textContent = mensagem;
  botaoConfirmar.textContent = rotuloConfirmar;
  botaoCancelar.textContent = rotuloCancelar;

  return new Promise((resolver) => {
    function encerrar(resposta) {
      // Remove os ouvintes antes de resolver: uma segunda chamada não resolve esta.
      botaoConfirmar.removeEventListener('click', aoConfirmar);
      botaoCancelar.removeEventListener('click', aoCancelar);
      dialogo.removeEventListener('cancel', aoEsc);
      dialogo.removeEventListener('close', aoFechar);
      if (dialogo.open) dialogo.close();
      resolver(resposta);
    }
    const aoConfirmar = () => encerrar(true);
    const aoCancelar = () => encerrar(false);
    const aoEsc = (evento) => {
      evento.preventDefault();
      encerrar(false);
    };
    const aoFechar = () => encerrar(false);

    botaoConfirmar.addEventListener('click', aoConfirmar);
    botaoCancelar.addEventListener('click', aoCancelar);
    dialogo.addEventListener('cancel', aoEsc);
    dialogo.addEventListener('close', aoFechar);

    dialogo.showModal();
    // A ação destrutiva nunca é o padrão.
    botaoCancelar.focus();
  });
}
