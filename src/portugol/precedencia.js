// Precedência das expressões do Portugol (spec 002, research R-05; spec 003, research R-06).
// Maior número liga mais forte. Um bloco de valor devolve { codigo, precedencia } e quem o
// encaixa pede uma precedência mínima no ctx.valor: abaixo dela, o código vai entre
// parênteses. Escala da 008/R-02: ou < e < nao < relacional < + - < * / % < - unário < primário.
// A 003 traz os níveis da conta aritmética; a 006 acrescenta OU, E, NAO e RELACIONAL abaixo
// de 50 e UNARIO entre 60 e 100.
export const PRECEDENCIA = Object.freeze({ ADITIVO: 50, MULTIPLICATIVO: 60, PRIMARIO: 100 });
