// Precedência das expressões do Portugol (spec 002, research R-05; spec 003, research R-06;
// spec 006, research R-03). Maior número liga mais forte. Um bloco de valor devolve
// { codigo, precedencia } e quem o encaixa pede uma precedência mínima no ctx.valor: abaixo
// dela, o código vai entre parênteses.
//
// Escala do Core (008/R-02): ou < e < nao < relacional < + - < * / % < - unário < primário.
// Relacional não é associativo no Core (`1 < 2 = verdadeiro` é erro), por isso os dois lados
// de uma comparação pedem RELACIONAL + 1. `nao` e o negativo pedem PRIMARIO do operando, para
// o estudante ver o que está sendo invertido: `nao (x > 10)`, `-(a + b)`.
export const PRECEDENCIA = Object.freeze({
  OU: 10,
  E: 20,
  NAO: 30,
  RELACIONAL: 40,
  ADITIVO: 50,
  MULTIPLICATIVO: 60,
  UNARIO: 70,
  PRIMARIO: 100,
});
