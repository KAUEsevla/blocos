// Painel Saída (RF-01; contracts/painel-saida.md). Interface, fora da cobertura.
// A 001 usa limpar e mostrarOrientacao; escrever e areaAvisos são para as specs 009 e 010.
import { TEXTOS } from './textos.js';

const TIPOS = new Set(['programa', 'sistema', 'erro']);

export function criarPainelSaida(elemento) {
  const areaLinhas = document.createElement('div');
  areaLinhas.className = 'saida-linhas';
  areaLinhas.setAttribute('role', 'log');
  areaLinhas.setAttribute('aria-live', 'polite');

  const areaAvisos = document.createElement('div');
  areaAvisos.className = 'saida-avisos';

  // Substitui o conteúdo: chamar de novo sobre o mesmo elemento não duplica as regiões.
  elemento.replaceChildren(areaLinhas, areaAvisos);

  function limpar() {
    areaLinhas.replaceChildren();
    areaAvisos.replaceChildren();
  }

  function escrever(texto, tipo = 'programa') {
    const tipoValido = TIPOS.has(tipo) ? tipo : 'programa';
    const linha = document.createElement('div');
    linha.className = `saida-linha saida-linha--${tipoValido}`;
    linha.textContent = String(texto);
    areaLinhas.append(linha);
    elemento.scrollTop = elemento.scrollHeight;
  }

  function mostrarOrientacao() {
    limpar();
    escrever(TEXTOS.orientacaoSaida, 'sistema');
  }

  return { limpar, mostrarOrientacao, escrever, areaAvisos };
}
