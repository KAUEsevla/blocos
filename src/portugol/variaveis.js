// Seção "var" do Portugol (RF-08, FR-002; spec 002 FR-004): uma variável por linha,
// agrupadas na ordem inteiro, real, cadeia, logico e, dentro do tipo, na ordem de criação.
import { TIPOS_VARIAVEL } from '../projeto/formato.js';

export function gerarSecaoVar(variaveis, emissor) {
  const lista = Array.isArray(variaveis) ? variaveis : [];
  if (lista.length === 0) return;

  for (const variavel of lista) {
    if (!TIPOS_VARIAVEL.includes(variavel.tipo)) {
      throw new Error(`Tipo de variável desconhecido: "${variavel.tipo}" (variável "${variavel.nome}").`);
    }
  }

  emissor.linha('var');
  emissor.entrar();
  for (const tipo of TIPOS_VARIAVEL) {
    for (const variavel of lista.filter((v) => v.tipo === tipo)) {
      emissor.linha(`${variavel.nome}: ${tipo}`);
    }
  }
  emissor.sair();
  emissor.linhaEmBranco();
}
