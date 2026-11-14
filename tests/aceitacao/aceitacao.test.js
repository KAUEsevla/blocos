// Suíte de aceitação (RNF-07, RF-08): projeto em blocos (JSON) → Portugol → meupia-core real → saída.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { criarMotorNode } from './suporte/motor-node.js';
import { validarCaso } from './suporte/validar-caso.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { compilarEExecutar } from '../../src/core/executor-core.js';
import { registroPadrao } from '../../src/blocos/registro.js';

const PASTA = join(import.meta.dirname, 'casos');
const casos = readdirSync(PASTA)
  .filter((nome) => nome.endsWith('.json'))
  .sort()
  .map((arquivo) => ({ arquivo, caso: validarCaso(JSON.parse(readFileSync(join(PASTA, arquivo), 'utf8')), arquivo) }));

// Blocos alcançáveis a partir do primeiro "programa" (via inputs e next); blocos soltos não contam.
function blocosDoPrograma(projeto) {
  const raiz = projeto.blocos?.blocks?.blocks?.find((b) => b.type === 'programa');
  const encontrados = [];
  const visitar = (no) => {
    for (let atual = no; atual; atual = atual.next?.block) {
      encontrados.push(atual);
      for (const entrada of Object.values(atual.inputs ?? {})) visitar(entrada.block);
    }
  };
  if (raiz) visitar(raiz);
  return encontrados;
}

describe('aceitação no meupia-core real', () => {
  let motor;

  beforeAll(async () => {
    motor = await criarMotorNode();
  });

  it('há casos de aceitação', () => {
    expect(casos.length).toBeGreaterThan(0);
  });

  describe.each(casos)('$arquivo', ({ caso }) => {
    it(caso.descricao, async () => {
      const { codigo, avisos } = gerarPortugol(caso.projeto);
      expect(avisos, 'o caso não pode ter blocos incompletos').toEqual([]);
      if (caso.portugolEsperado !== undefined) expect(codigo).toBe(caso.portugolEsperado);

      const resultado = await compilarEExecutar(motor, codigo, caso.entrada);
      expect(resultado.status, resultado.erro?.mensagem).not.toBe('erro_compilacao');
      expect(resultado.status).toBe(caso.statusEsperado ?? 'ok');
      expect(resultado.saida).toBe(caso.saidaEsperada);
    });
  });
});

describe('meta-aceitação', () => {
  const blocosPorCaso = casos.map(({ arquivo, caso }) => ({ arquivo, blocos: blocosDoPrograma(caso.projeto) }));

  it('todo par (tipo, variante) registrado aparece em algum caso (SC-002)', () => {
    const faltando = [];
    for (const tipo of registroPadrao.tiposRegistrados()) {
      for (const variante of registroPadrao.variantesDe(tipo)) {
        const coberta = blocosPorCaso.some(({ blocos }) =>
          blocos.some((b) => b.type === tipo && variante.presente(b)),
        );
        if (!coberta) faltando.push(`${tipo} (${variante.nome})`);
      }
    }
    expect(faltando, 'pares (tipo, variante) sem caso de aceitação').toEqual([]);
  });

  it('casos com blocos que têm área de comandos trazem portugolEsperado', () => {
    const semTexto = casos
      .filter(({ caso }) => caso.portugolEsperado === undefined)
      .filter(({ caso }) =>
        blocosDoPrograma(caso.projeto).some((b) => {
          const entrada = registroPadrao.obter(b.type);
          return entrada && entrada.categoria !== 'raiz' && entrada.areas.length > 0;
        }),
      )
      .map(({ arquivo }) => arquivo);
    expect(semTexto).toEqual([]);
  });
});
