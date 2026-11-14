// Blocos falsos, só para testes: permitem testar estrutura, indentação e avisos do gerador
// antes de existirem os blocos reais das specs 002–006.
import { criarRegistro } from '../../src/blocos/registro.js';
import { BLOCO_PROGRAMA } from '../../src/blocos/programa.js';
import { projetoVazio } from '../../src/projeto/formato.js';

let contador = 0;
const novoId = (tipo) => `${tipo}-${++contador}`;

export function criarRegistroTeste() {
  const r = criarRegistro();
  r.registrarBloco(BLOCO_PROGRAMA);
  r.registrarBloco({
    tipo: 'teste_comando',
    rotulo: 'comando de teste',
    categoria: 'comando',
    definicao: { type: 'teste_comando' },
    gerar: (_bloco, ctx) => ctx.linha('escreva("x")'),
  });
  r.registrarBloco({
    tipo: 'teste_bloco',
    rotulo: 'bloco de teste',
    categoria: 'comando',
    areas: ['CORPO'],
    definicao: { type: 'teste_bloco' },
    gerar: (bloco, ctx) => {
      ctx.linha('se verdadeiro entao');
      ctx.comandos(bloco, 'CORPO');
      ctx.linha('fim_se');
    },
  });
  r.registrarBloco({
    tipo: 'teste_valor',
    rotulo: 'valor de teste',
    categoria: 'valor',
    definicao: { type: 'teste_valor' },
    gerar: () => ({ codigo: '1', precedencia: 99 }),
  });
  r.registrarBloco({
    tipo: 'teste_se',
    rotulo: 'se',
    categoria: 'comando',
    areas: ['CORPO'],
    definicao: { type: 'teste_se' },
    gerar: (bloco, ctx) => {
      ctx.linha(`se ${ctx.valor(bloco, 'CONDICAO', 'a condição')} entao`);
      ctx.comandos(bloco, 'CORPO');
      ctx.linha('fim_se');
    },
  });
  r.registrarBloco({
    tipo: 'teste_leia',
    rotulo: 'leia',
    categoria: 'comando',
    definicao: { type: 'teste_leia' },
    gerar: (bloco, ctx) => ctx.linha(`leia(${ctx.variavel(bloco, 'VAR', 'a variável')})`),
  });
  return r;
}

// Cria um nó de bloco serializado. "entradas" vira inputs; cada valor é um bloco ou uma lista (cadeia).
export function bloco(tipo, { entradas = {}, campos, id } = {}) {
  const no = { type: tipo, id: id ?? novoId(tipo) };
  if (campos) no.fields = campos;
  const inputs = {};
  for (const [nome, valor] of Object.entries(entradas)) {
    const primeiro = Array.isArray(valor) ? encadear(valor) : valor;
    if (primeiro) inputs[nome] = { block: primeiro };
  }
  if (Object.keys(inputs).length > 0) no.inputs = inputs;
  return no;
}

// Liga uma lista de blocos pelo "next" e devolve o primeiro (ou undefined).
export function encadear(blocos) {
  const copias = blocos.map((b) => ({ ...b }));
  for (let i = copias.length - 2; i >= 0; i--) copias[i].next = { block: copias[i + 1] };
  return copias[0];
}

// Projeto no formato v1 com a cadeia de comandos dentro do programa e blocos soltos opcionais.
export function projetoDeTeste({ nome = 'MeuPrograma', variaveis = [], comandos = [], soltos = [] } = {}) {
  const projeto = projetoVazio();
  projeto.nome = nome;
  projeto.variaveis = variaveis;
  const raiz = projeto.blocos.blocks.blocks[0];
  const primeiro = encadear(comandos);
  if (primeiro) raiz.inputs = { COMANDOS: { block: primeiro } };
  projeto.blocos.blocks.blocks.push(...soltos);
  return projeto;
}
