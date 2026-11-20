// Mídia do Blockly servida pelo próprio app (RF-01, RNF-06). Sem a opção "media", o Blockly
// busca sprites.png, cursores e sons em https://blockly-demo.appspot.com/static/media/, e os
// controles da área de blocos (centralizar, +, −, lixeira) aparecem quebrados sem essa rede.
// Este plugin do Vite serve node_modules/blockly/media em /blockly-media/ no dev e copia os
// arquivos para dist/blockly-media/ no build: a versão da mídia acompanha a do pacote, sem cópia
// versionada no repositório.
import { readdirSync, readFileSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { PASTA_MIDIA_BLOCKLY } from '../src/ui/midia-blockly.js';

const require = createRequire(import.meta.url);
// O pacote não exporta package.json; a mídia fica ao lado do ponto de entrada.
export const ORIGEM_MIDIA_BLOCKLY = join(dirname(require.resolve('blockly')), 'media');

const TIPOS = {
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.cur': 'image/x-icon',
};

export function arquivosMidiaBlockly(origem = ORIGEM_MIDIA_BLOCKLY) {
  return readdirSync(origem).filter((nome) => Object.hasOwn(TIPOS, extname(nome)));
}

export function midiaBlockly(origem = ORIGEM_MIDIA_BLOCKLY) {
  const arquivos = new Set(arquivosMidiaBlockly(origem));
  const prefixo = `/${PASTA_MIDIA_BLOCKLY}`;
  return {
    name: 'midia-blockly',
    configureServer(servidor) {
      servidor.middlewares.use((pedido, resposta, seguir) => {
        const caminho = (pedido.url ?? '').split('?')[0];
        const nome = caminho.startsWith(prefixo) ? decodeURIComponent(caminho.slice(prefixo.length)) : null;
        if (!nome || !arquivos.has(nome)) return seguir();
        resposta.setHeader('Content-Type', TIPOS[extname(nome)]);
        resposta.end(readFileSync(join(origem, nome)));
      });
    },
    generateBundle() {
      for (const nome of arquivos) {
        this.emitFile({ type: 'asset', fileName: `${PASTA_MIDIA_BLOCKLY}${nome}`, source: readFileSync(join(origem, nome)) });
      }
    },
  };
}
