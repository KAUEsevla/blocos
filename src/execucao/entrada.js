// Textos do pedido de entrada do leia (spec 010, contracts/entrada.md; research R-06).
// Núcleo: monta o rótulo e a dica do campo a partir da variável pedida e do registro de
// variáveis da 002 (o mesmo do campo VAR do leia). Sem DOM nem Pyodide.

const NOMES_TIPOS = Object.freeze({
  cadeia: 'cadeia',
  inteiro: 'inteiro',
  real: 'real',
  logico: 'lógico',
});

const DICAS = Object.freeze({
  inteiro: 'Número sem casas decimais, por exemplo 15.',
  real: 'Use ponto para separar as casas decimais, por exemplo 1.72.',
  logico: 'Digite verdadeiro ou falso. Só "verdadeiro" vira verdadeiro.',
});

export const TEXTOS_ENTRADA = Object.freeze({
  confirmar: 'Confirmar',
  valorGenerico: 'Digite um valor',
  valorDe: (nome, tipo) => `Digite o valor de ${nome} (${tipo})`,
});

export function criarPedidoEntrada(variavel, variaveis = []) {
  const encontrada = variavel ? (variaveis ?? []).find((v) => v.nome === variavel) : undefined;
  if (!encontrada || !Object.hasOwn(NOMES_TIPOS, encontrada.tipo)) {
    return { rotulo: TEXTOS_ENTRADA.valorGenerico, dica: null, confirmar: TEXTOS_ENTRADA.confirmar };
  }
  return {
    rotulo: TEXTOS_ENTRADA.valorDe(encontrada.nome, NOMES_TIPOS[encontrada.tipo]),
    dica: DICAS[encontrada.tipo] ?? null,
    confirmar: TEXTOS_ENTRADA.confirmar,
  };
}
