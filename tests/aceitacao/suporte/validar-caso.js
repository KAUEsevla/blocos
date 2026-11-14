// Validação dos casos de aceitação conforme contracts/caso-aceitacao.schema.json, sem dependência nova.

const CHAVES = new Set([
  'descricao',
  'requisitos',
  'projeto',
  'entrada',
  'portugolEsperado',
  'saidaEsperada',
  'statusEsperado',
]);
const REQUISITO = /^(RF|RNF)-[A-Z]?[0-9]{2}$/;
const TIPOS = new Set(['inteiro', 'real', 'cadeia', 'logico']);
const STATUS = new Set(['ok', 'erro_execucao']);

export function validarCaso(caso, arquivo) {
  const erros = [];
  const exigir = (condicao, mensagem) => {
    if (!condicao) erros.push(mensagem);
  };

  exigir(caso && typeof caso === 'object' && !Array.isArray(caso), 'o caso precisa ser um objeto');
  if (erros.length === 0) {
    for (const chave of Object.keys(caso)) exigir(CHAVES.has(chave), `chave desconhecida "${chave}"`);
    exigir(typeof caso.descricao === 'string' && caso.descricao.trim() !== '', '"descricao" vazia');
    exigir(
      Array.isArray(caso.requisitos) && caso.requisitos.length > 0 && caso.requisitos.every((r) => REQUISITO.test(r)),
      '"requisitos" precisa listar IDs como RF-08 ou RNF-07',
    );
    const p = caso.projeto;
    exigir(p && typeof p === 'object', '"projeto" ausente');
    if (p && typeof p === 'object') {
      exigir(p.formato === 'meupia-blocos', '"projeto.formato" precisa ser "meupia-blocos"');
      exigir(p.versao === 1, '"projeto.versao" precisa ser 1');
      exigir(typeof p.nome === 'string', '"projeto.nome" precisa ser texto');
      exigir(p.blocos && typeof p.blocos === 'object', '"projeto.blocos" precisa ser um objeto');
      exigir(
        Array.isArray(p.variaveis) &&
          p.variaveis.every((v) => v && typeof v.id === 'string' && typeof v.nome === 'string' && TIPOS.has(v.tipo)),
        '"projeto.variaveis" precisa ter id, nome e tipo (inteiro, real, cadeia ou logico)',
      );
    }
    exigir(
      Array.isArray(caso.entrada) && caso.entrada.every((e) => typeof e === 'string'),
      '"entrada" precisa ser uma lista de textos',
    );
    exigir(typeof caso.saidaEsperada === 'string', '"saidaEsperada" precisa ser texto');
    exigir(
      caso.portugolEsperado === undefined || typeof caso.portugolEsperado === 'string',
      '"portugolEsperado" precisa ser texto',
    );
    exigir(
      caso.statusEsperado === undefined || STATUS.has(caso.statusEsperado),
      '"statusEsperado" precisa ser "ok" ou "erro_execucao"',
    );
  }

  if (erros.length > 0) {
    throw new Error(`Caso de aceitação inválido (${arquivo}): ${erros.join('; ')}`);
  }
  return caso;
}
