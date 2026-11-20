// Mídia do Blockly servida pelo app (RF-01, RNF-06): a opção "media" do Blockly.inject aponta
// para uma pasta local, e o plugin do Vite serve (dev) e copia (build) todos os arquivos dela.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PASTA_MIDIA_BLOCKLY } from '../../src/ui/midia-blockly.js';
import { midiaBlockly, arquivosMidiaBlockly, ORIGEM_MIDIA_BLOCKLY } from '../../scripts/midia-blockly.mjs';

const RAIZ = join(import.meta.dirname, '..', '..');
const ler = (caminho) => readFileSync(join(RAIZ, caminho), 'utf8');

function arquivosDe(pasta) {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? arquivosDe(caminho) : [caminho];
  });
}

describe('mídia do Blockly local (RNF-06)', () => {
  it('a pasta é um caminho relativo, sem protocolo nem host', () => {
    expect(PASTA_MIDIA_BLOCKLY).toBe('blockly-media/');
    expect(PASTA_MIDIA_BLOCKLY).not.toMatch(/^[a-z]+:|^\/\//i);
  });

  it('o Blockly.inject passa a opção media com essa pasta', () => {
    const workspace = ler('src/ui/workspace.js');
    const injecao = workspace.slice(workspace.indexOf('Blockly.inject('));
    expect(injecao.slice(0, injecao.indexOf('});'))).toMatch(/\bmedia:\s*PASTA_MIDIA_BLOCKLY\b/);
    expect(workspace).toMatch(/import \{ PASTA_MIDIA_BLOCKLY \} from '\.\/midia-blockly\.js';/);
  });

  it('nenhum arquivo do app ou da página cita o servidor de mídia do Blockly', () => {
    const arquivos = [join(RAIZ, 'index.html'), ...arquivosDe(join(RAIZ, 'src'))];
    for (const arquivo of arquivos) {
      expect(readFileSync(arquivo, 'utf8'), arquivo).not.toMatch(/blockly-demo\.appspot\.com/);
    }
  });

  it('o plugin está registrado no vite.config.js', () => {
    expect(ler('vite.config.js')).toMatch(/plugins: \[pyodideSemNode\(\), midiaBlockly\(\)\]/);
  });

  it('a mídia inclui os sprites dos controles (centralizar, +, −) e a lixeira', () => {
    const nomes = arquivosMidiaBlockly();
    expect(nomes).toEqual(expect.arrayContaining(['sprites.png', 'sprites.svg', 'delete-icon.svg', 'handdelete.cur']));
    expect(nomes.length).toBe(readdirSync(ORIGEM_MIDIA_BLOCKLY).length);
  });

  it('no build, todos os arquivos vão para dist/blockly-media/', () => {
    const emitidos = [];
    midiaBlockly().generateBundle.call({ emitFile: (arquivo) => emitidos.push(arquivo) });
    expect(emitidos.map((a) => a.fileName).sort()).toEqual(arquivosMidiaBlockly().map((n) => `blockly-media/${n}`).sort());
    const sprites = emitidos.find((a) => a.fileName === 'blockly-media/sprites.png');
    expect(Buffer.compare(sprites.source, readFileSync(join(ORIGEM_MIDIA_BLOCKLY, 'sprites.png')))).toBe(0);
  });

  it('no dev, o servidor entrega os arquivos da pasta e deixa passar o resto', () => {
    let middleware;
    midiaBlockly().configureServer({ middlewares: { use: (fn) => (middleware = fn) } });
    const pedir = (url) => {
      const resposta = { cabecalhos: {}, setHeader(k, v) { this.cabecalhos[k] = v; }, end(corpo) { this.corpo = corpo; } };
      let seguiu = false;
      middleware({ url }, resposta, () => (seguiu = true));
      return { resposta, seguiu };
    };

    const sprites = pedir('/blockly-media/sprites.png?v=1');
    expect(sprites.seguiu).toBe(false);
    expect(sprites.resposta.cabecalhos['Content-Type']).toBe('image/png');
    expect(sprites.resposta.corpo.length).toBeGreaterThan(0);
    expect(pedir('/blockly-media/click.mp3').resposta.cabecalhos['Content-Type']).toBe('audio/mpeg');

    expect(pedir('/blockly-media/../package.json').seguiu).toBe(true);
    expect(pedir('/blockly-media/nao-existe.png').seguiu).toBe(true);
    expect(pedir('/src/main.js').seguiu).toBe(true);
  });
});
