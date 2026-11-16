import { defineConfig } from 'vite';

// Build estático (sem backend, RNF-06) e configuração do Vitest.
// Dois projetos de teste: "unidade" (Node puro, rápido) e "aceitacao" (Pyodide + meupia-core real).
export default defineConfig({
  // O worker de execução importa módulos (pyodide, src/core/): formato ES (spec 009, research R-02).
  worker: { format: 'es' },
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
