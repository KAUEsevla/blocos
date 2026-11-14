// Nome do programa no "algoritmo" (RF-08, FR-007; research R-11).

const NOME_PADRAO = 'MeuPrograma';
const TAMANHO_MAXIMO = 40;
// Aspas e barra invertida quebrariam o texto do "algoritmo"; caracteres de controle quebrariam a linha.
const PROIBIDOS = /["\\\u0000-\u001f\u007f-\u009f]/g;

export function sanearNomePrograma(nome) {
  const limpo = String(nome ?? '')
    .normalize('NFC')
    .replace(PROIBIDOS, '')
    .trim();
  // Corta por pontos de código para não partir um caractere acentuado.
  const cortado = Array.from(limpo).slice(0, TAMANHO_MAXIMO).join('').trimEnd();
  return cortado === '' ? NOME_PADRAO : cortado;
}
