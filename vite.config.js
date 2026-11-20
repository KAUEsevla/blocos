import { defineConfig } from 'vite';
import { midiaBlockly } from './scripts/midia-blockly.mjs';

// Build estático (sem backend, RNF-06) e configuração do Vitest.
// Dois projetos de teste: "unidade" (Node puro, rápido) e "aceitacao" (Pyodide + meupia-core real).
// Spec 009 (research R-02): o carregador do Pyodide tem imports dinâmicos que só rodam no
// Node (node-fetch, ws e módulos nativos). No navegador eles nunca são chamados; este plugin
// os troca por um módulo vazio quando quem importa é o próprio Pyodide, para o Vite (dev e
// build) não tentar resolvê-los. No Vitest o pacote pyodide é carregado pelo Node, sem passar
// por aqui.
const PYODIDE_SO_NODE = new Set(['node-fetch', 'ws', 'url', 'fs', 'fs/promises', 'vm', 'path', 'crypto', 'child_process']);
const PREFIXO_VAZIO = '\0pyodide-so-node:';

function pyodideSemNode() {
  return {
    name: 'pyodide-sem-node',
    enforce: 'pre',
    resolveId(id, importador) {
      if (PYODIDE_SO_NODE.has(id) && importador && /[\\/]pyodide[\\/]/.test(importador)) return PREFIXO_VAZIO + id;
      return null;
    },
    load(id) {
      return id.startsWith(PREFIXO_VAZIO) ? 'export default {};' : null;
    },
  };
}

export default defineConfig({
  // midiaBlockly: ícones, cursores e sons do Blockly servidos pelo app (RNF-06).
  plugins: [pyodideSemNode(), midiaBlockly()],
  // O worker de execução importa módulos (pyodide, src/core/): formato ES (spec 009, research R-02).
  worker: {
    format: 'es',
    plugins: () => [pyodideSemNode()],
  },
  // O Pyodide carrega os próprios arquivos (asm.js, wasm, stdlib) do CDN: não pré-empacotar.
  optimizeDeps: { exclude: ['pyodide'] },
  test: {
    projects: [
      {
        test: {
          name: 'unidade',
          include: ['tests/unidade/**/*.test.js'],
          environment: 'node',
          sequence: { groupOrder: 0 },
        },
      },
      {
        test: {
          name: 'aceitacao',
          include: ['tests/aceitacao/**/*.test.js'],
          environment: 'node',
          testTimeout: 120000,
          hookTimeout: 120000,
          // Um único worker: o Pyodide é carregado uma vez e reaproveitado (R-04).
          pool: 'forks',
          maxWorkers: 1,
          isolate: false,
          // Grupo próprio (exigência do Vitest 4 para projetos com maxWorkers diferentes): roda depois da unidade.
          sequence: { groupOrder: 1 },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/portugol/**', 'src/blocos/**', 'src/projeto/**', 'src/core/**', 'src/execucao/**'],
      // Exclusão declarada (constitution, princípio IV): só interface e renderização.
      // src/execucao/worker.js: cola de navegador, verificada no quickstart (spec 009, research R-11).
      exclude: ['src/ui/**', 'src/main.js', 'src/execucao/worker.js'],
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: 'cobertura',
      thresholds: { lines: 80, branches: 80 },
    },
  },
});
