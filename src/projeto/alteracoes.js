// Alterações não salvas (RF-01; spec 001, FR-007; contracts/alteracoes.md; research R-05).
// Função pura: compara o projeto aberto com a assinatura do último estado salvo.
// Usada pelo Novo (001) e pelas specs 011 (Salvar) e 012 (Carregar).

// Cópia com as chaves dos objetos em ordem alfabética, em todos os níveis. Arrays mantêm a
// ordem: a ordem dos blocos e das variáveis é conteúdo.
function ordenarChaves(valor) {
  if (Array.isArray(valor)) return valor.map(ordenarChaves);
  if (valor === null || typeof valor !== 'object') return valor;
  const ordenado = {};
  for (const chave of Object.keys(valor).sort()) ordenado[chave] = ordenarChaves(valor[chave]);
  return ordenado;
}

// formato e versao ficam de fora: não são conteúdo do estudante.
export function assinaturaProjeto({ nome = '', variaveis = [], blocos = {} } = {}) {
  return JSON.stringify(ordenarChaves({ nome, variaveis, blocos }));
}

export function haAlteracoes(projeto, referencia) {
  return assinaturaProjeto(projeto) !== referencia;
}
