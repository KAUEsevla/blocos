// Precedência das expressões do Portugol (RF-02; spec 002, research R-05).
// Maior número liga mais forte. Um bloco de valor devolve { codigo, precedencia } e quem o
// encaixa decide se precisa de parênteses. A spec 006 acrescenta os níveis dos operadores
// abaixo de PRIMARIO, seguindo a escala da 008/R-02 (ou < e < nao < relacional < + - <
// * / % < - unário < primário).
export const PRECEDENCIA = Object.freeze({ PRIMARIO: 100 });
