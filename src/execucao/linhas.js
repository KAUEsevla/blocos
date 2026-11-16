// Divisor de linhas da Saída (spec 009, research R-08; contracts/executar.md).
// Recebe os pedaços que o programa escreve, na ordem, e devolve as linhas completas:
// uma por \n, ou seja, uma por escreva (FR-003 da 003). Não toca o DOM.

export function criarDivisorLinhas() {
  let resto = '';

  function acrescentar(pedaco) {
    const texto = resto + String(pedaco ?? '');
    // Um \r no fim pode ser a metade de um \r\n que chega no próximo pedaço.
    const partes = texto.split(/\r?\n/);
    resto = partes.pop();
    return partes;
  }

  function finalizar() {
    const ultimo = resto.endsWith('\r') ? resto.slice(0, -1) : resto;
    resto = '';
    return ultimo === '' ? [] : [ultimo];
  }

  return { acrescentar, finalizar };
}
