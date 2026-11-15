// Diálogo de variável: criar, renomear e mudar o tipo (RF-02; spec 002, research R-07;
// contracts/editor-variaveis.md). Interface, fora da cobertura: a regra do nome vem pronta
// em "validar" (validarNomeVariavel, do núcleo).
import { TEXTOS } from './textos.js';

const MODOS = {
  criar: { titulo: () => TEXTOS.criarVariavelTitulo, botao: TEXTOS.criarVariavelBotao, nome: true, tipo: true },
  renomear: { titulo: (nome) => TEXTOS.renomearVariavelTitulo(nome), botao: TEXTOS.renomearVariavelBotao, nome: true, tipo: false },
  tipo: { titulo: (nome) => TEXTOS.tipoVariavelTitulo(nome), botao: TEXTOS.tipoVariavelBotao, nome: false, tipo: true },
};

// Resolve com { nome, tipo } (nome sem os espaços das pontas) ou null se o estudante desistir.
export function pedirVariavel({ modo, nome = '', tipo = 'inteiro', validar }) {
  const config = MODOS[modo];
  if (!config) throw new Error(`Modo de diálogo desconhecido: "${modo}".`);

  const dialogo = document.getElementById('dialogo-variavel');
  const formulario = dialogo.querySelector('form');
  const campoNome = document.getElementById('variavel-nome');
  const campoTipo = document.getElementById('variavel-tipo');
  const erro = document.getElementById('variavel-erro');
  const botaoCancelar = document.getElementById('variavel-cancelar');

  document.getElementById('variavel-titulo').textContent = config.titulo(nome);
  document.getElementById('variavel-confirmar').textContent = config.botao;
  document.getElementById('variavel-rotulo-nome').hidden = !config.nome;
  document.getElementById('variavel-rotulo-tipo').hidden = !config.tipo;
  campoNome.value = nome;
  campoTipo.value = tipo;
  erro.textContent = '';

  return new Promise((resolver) => {
    function encerrar(resposta) {
      // Remove os ouvintes antes de resolver: uma segunda chamada não resolve esta.
      formulario.removeEventListener('submit', aoEnviar);
      botaoCancelar.removeEventListener('click', aoCancelar);
      dialogo.removeEventListener('cancel', aoEsc);
      dialogo.removeEventListener('close', aoFechar);
      if (dialogo.open) dialogo.close();
      resolver(resposta);
    }

    function aoEnviar(evento) {
      evento.preventDefault();
      let nomeFinal = nome;
      if (config.nome) {
        const resultado = validar(campoNome.value);
        if (!resultado.valido) {
          // O diálogo continua aberto com o que foi digitado (research R-07, SC-002).
          erro.textContent = resultado.mensagem;
          campoNome.focus();
          return;
        }
        nomeFinal = resultado.nome;
      }
      encerrar({ nome: nomeFinal, tipo: campoTipo.value });
    }
    const aoCancelar = () => encerrar(null);
    const aoEsc = (evento) => {
      evento.preventDefault();
      encerrar(null);
    };
    const aoFechar = () => encerrar(null);

    formulario.addEventListener('submit', aoEnviar);
    botaoCancelar.addEventListener('click', aoCancelar);
    dialogo.addEventListener('cancel', aoEsc);
    dialogo.addEventListener('close', aoFechar);

    dialogo.showModal();
    if (config.nome) {
      campoNome.focus();
      campoNome.select();
    } else {
      campoTipo.focus();
    }
  });
}
