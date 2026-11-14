import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { criarRegistroTeste, bloco, projetoDeTeste } from '../auxiliares/blocos-teste.js';

const registro = criarRegistroTeste();

const projetos = {
  vazio: projetoDeTeste(),
  comVariaveis: projetoDeTeste({
    nome: 'Notas',
    variaveis: [
      { id: 'a', nome: 'nome', tipo: 'cadeia' },
      { id: 'b', nome: 'nota', tipo: 'real' },
      { id: 'c', nome: 'n', tipo: 'inteiro' },
    ],
    comandos: [bloco('teste_comando')],
  }),
  aninhado: projetoDeTeste({
    comandos: [bloco('teste_bloco', { entradas: { CORPO: [bloco('teste_bloco', { entradas: { CORPO: [bloco('teste_comando')] } })] } })],
  }),
};

describe('determinismo do gerador (RF-08, FR-004, princípio II)', () => {
  it.each(Object.entries(projetos))('%s gera o mesmo texto sempre', (_nome, projeto) => {
    const primeiro = gerarPortugol(projeto, registro);
    const segundo = gerarPortugol(projeto, registro);
    const copia = gerarPortugol(JSON.parse(JSON.stringify(projeto)), registro);
    expect(segundo).toEqual(primeiro);
    expect(copia).toEqual(primeiro);
    expect(copia.codigo).toBe(primeiro.codigo);
  });

  it('o núcleo src/portugol não depende de relógio, aleatoriedade nem DOM', () => {
    const pasta = join(import.meta.dirname, '..', '..', 'src', 'portugol');
    const proibidos = /\b(Date|Math\.random|performance\.now|document|window)\b/;
    const achados = readdirSync(pasta)
      .filter((nome) => nome.endsWith('.js'))
      .filter((nome) => {
        const semComentarios = readFileSync(join(pasta, nome), 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*$/gm, '');
        return proibidos.test(semComentarios);
      });
    expect(achados).toEqual([]);
  });
});
