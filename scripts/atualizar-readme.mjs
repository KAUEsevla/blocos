// Atualiza a linha "**Testes:** N · **Cobertura:** X%" já existente no README, no mesmo lugar
// (formato e posição do modelo do repositório oficial; constitution v1.2.0, princípio IV; RNF-04).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(import.meta.dirname, '..');
const README = join(RAIZ, 'README.md');

function lerJson(caminho) {
  try {
    return JSON.parse(readFileSync(caminho, 'utf8'));
  } catch (erro) {
    throw new Error(`Não foi possível ler ${caminho}. Rode "npm run cobertura". (${erro.message})`);
  }
}

export function formatarPercentual(pct) {
  const arredondado = Math.round(pct * 10) / 10;
  return Number.isInteger(arredondado) ? String(arredondado) : arredondado.toFixed(1).replace('.', ',');
}

export function atualizarLinha(texto, testes, pct) {
  const linhas = texto.split(/(\r?\n)/);
  const indice = linhas.findIndex((linha) => linha.startsWith('**Testes:**'));
  if (indice < 0) {
    throw new Error('O README não tem a linha que começa com "**Testes:**"; nada foi alterado.');
  }
  linhas[indice] = `**Testes:** ${testes} · **Cobertura:** ${formatarPercentual(pct)}%`;
  return linhas.join('');
}

const cobertura = lerJson(join(RAIZ, 'cobertura', 'coverage-summary.json'));
const testes = lerJson(join(RAIZ, 'cobertura', 'testes.json'));
const novo = atualizarLinha(readFileSync(README, 'utf8'), testes.numTotalTests, cobertura.total.lines.pct);
writeFileSync(README, novo);
console.log(`README atualizado: ${testes.numTotalTests} testes · ${formatarPercentual(cobertura.total.lines.pct)}% de cobertura`);
