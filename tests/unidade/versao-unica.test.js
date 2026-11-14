import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { MEUPIA_CORE_VERSAO } from '../../src/config.js';

const RAIZ = join(import.meta.dirname, '..', '..');
const PASTAS = ['src', 'tests', 'scripts', '.github'];
const ARQUIVOS = ['index.html', 'package.json', 'vite.config.js'];
const IGNORAR = new Set([join(RAIZ, 'src', 'config.js')]);
const EXTENSOES_LITERAL = new Set(['.js', '.mjs', '.html', '.yml']);

function listar(pasta) {
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta).flatMap((nome) => {
    if (nome === 'node_modules') return [];
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? listar(caminho) : [caminho];
  });
}

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('versão do Core num ponto só (RNF-02)', () => {
  const arquivos = [
    ...PASTAS.flatMap((p) => listar(join(RAIZ, p))),
    ...ARQUIVOS.map((a) => join(RAIZ, a)).filter(existsSync),
  ].filter((a) => !IGNORAR.has(a));

  const pino = /meupia[-_]core\s*(==|@|>=|~=)\s*\d/i;
  const v = escaparRegex(MEUPIA_CORE_VERSAO);
  const literal = new RegExp(`(['"\`])${v}\\1`);

  it('nenhum arquivo de código ou configuração repete a versão', () => {
    const achados = [];
    for (const arquivo of arquivos) {
      const linhas = readFileSync(arquivo, 'utf8').split(/\r?\n/);
      const checarLiteral = EXTENSOES_LITERAL.has(extname(arquivo));
      linhas.forEach((linha, i) => {
        if (pino.test(linha) || (checarLiteral && literal.test(linha))) {
          achados.push(`${relative(RAIZ, arquivo)}:${i + 1}`);
        }
      });
    }
    expect(achados).toEqual([]);
  });
});
