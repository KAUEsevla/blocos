// Painel Saída (RF-01; contracts/painel-saida.md). Interface, fora da cobertura.
// A 001 usa limpar e mostrarOrientacao. A spec 009 (contracts/tela-execucao.md) acrescenta
// escreverVarias (lotes de linhas), escreverDetalhe ("Detalhes técnicos") e mostrarAvisos
// (bloqueio por blocos incompletos). A spec 010 (contracts/tela-entrada.md) acrescenta o campo
// de entrada do leia (pedirEntrada, cancelarEntrada) e o tipo de linha 'entrada'.
import { TEXTOS } from './textos.js';
import { renderizarAvisos } from './avisos-ui.js';
import { MENSAGENS_EXECUCAO } from '../execucao/mensagens.js';

const TIPOS = new Set(['programa', 'sistema', 'erro', 'entrada']);
let contadorCampos = 0;

export function criarPainelSaida(elemento) {
  const areaLinhas = document.createElement('div');
  areaLinhas.className = 'saida-linhas';
  areaLinhas.setAttribute('role', 'log');
  areaLinhas.setAttribute('aria-live', 'polite');

  const areaAvisos = document.createElement('div');
  areaAvisos.className = 'saida-avisos';

  // Substitui o conteúdo: chamar de novo sobre o mesmo elemento não duplica as regiões.
  elemento.replaceChildren(areaLinhas, areaAvisos);

  function rolarAteOFim() {
    elemento.scrollTop = elemento.scrollHeight;
  }

  function criarLinha(texto, tipo) {
    const tipoValido = TIPOS.has(tipo) ? tipo : 'programa';
    const linha = document.createElement('div');
    linha.className = `saida-linha saida-linha--${tipoValido}`;
    linha.textContent = String(texto);
    return linha;
  }

  function limpar() {
    campoAberto = null;
    areaLinhas.replaceChildren();
    areaAvisos.replaceChildren();
  }

  function escrever(texto, tipo = 'programa') {
    areaLinhas.append(criarLinha(texto, tipo));
    rolarAteOFim();
  }

  // Um lote inteiro de uma vez, com uma única rolagem (research R-13).
  function escreverVarias(linhas, tipo = 'programa') {
    const fragmento = document.createDocumentFragment();
    for (const texto of linhas) fragmento.append(criarLinha(texto, tipo));
    areaLinhas.append(fragmento);
    rolarAteOFim();
  }

  // Rastro técnico, fechado por padrão (cenário 3 da História 2).
  function escreverDetalhe(texto) {
    const detalhes = document.createElement('details');
    detalhes.className = 'saida-detalhe';
    const resumo = document.createElement('summary');
    resumo.textContent = MENSAGENS_EXECUCAO.detalhesTecnicos;
    const pre = document.createElement('pre');
    pre.textContent = String(texto);
    detalhes.append(resumo, pre);
    areaLinhas.append(detalhes);
    rolarAteOFim();
  }

  function mostrarAvisos(avisos, aoClicar) {
    renderizarAvisos(areaAvisos, avisos, aoClicar);
  }

  // Campo do leia dentro da Saída (FR-002, SC-002): sem window.prompt. Enter ou o botão
  // confirmam; o valor volta sem trim (FR-004). Só um campo por vez.
  let campoAberto = null;

  function cancelarEntrada() {
    campoAberto?.remove();
    campoAberto = null;
  }

  function pedirEntrada({ rotulo, dica, confirmar }) {
    cancelarEntrada();
    contadorCampos += 1;
    const idCampo = `saida-entrada-${contadorCampos}`;

    const form = document.createElement('form');
    form.className = 'saida-entrada';
    const label = document.createElement('label');
    label.htmlFor = idCampo;
    label.textContent = String(rotulo);
    const input = document.createElement('input');
    input.type = 'text';
    input.id = idCampo;
    input.autocomplete = 'off';
    input.spellcheck = false;
    const botao = document.createElement('button');
    botao.type = 'submit';
    botao.textContent = String(confirmar);
    form.append(label, input, botao);
    if (dica) {
      const textoDica = document.createElement('span');
      textoDica.className = 'saida-entrada-dica';
      textoDica.id = `${idCampo}-dica`;
      textoDica.textContent = String(dica);
      input.setAttribute('aria-describedby', textoDica.id);
      form.append(textoDica);
    }

    areaLinhas.append(form);
    campoAberto = form;
    rolarAteOFim();
    input.focus();

    return new Promise((resolver) => {
      form.addEventListener('submit', (evento) => {
        evento.preventDefault();
        if (campoAberto !== form) return;
        const valor = input.value;
        cancelarEntrada();
        resolver(valor);
      });
    });
  }

  function mostrarOrientacao() {
    limpar();
    escrever(TEXTOS.orientacaoSaida, 'sistema');
  }

  return {
    limpar,
    mostrarOrientacao,
    escrever,
    escreverVarias,
    escreverDetalhe,
    mostrarAvisos,
    pedirEntrada,
    cancelarEntrada,
    areaAvisos,
  };
}
