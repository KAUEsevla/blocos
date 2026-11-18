// Carregar no caminho real (RF-12, RNF-07; spec 012, research R-10): cada caso de aceitação vira
// arquivo, passa pela leitura e validação do Carregar, é carregado no Blockly como o editor
// carrega e o Portugol resultante é executado no meupia-core real. Só o Portugol e a saída são
// comparados: casos escritos à mão ("007", "3,5") são normalizados pelo validador ao carregar.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { criarMotorNode } from './suporte/motor-node.js';
import { validarCaso } from './suporte/validar-caso.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { compilarEExecutar } from '../../src/core/executor-core.js';
import { textoArquivo } from '../../src/projeto/formato.js';
import { prepararCarregamento } from '../../src/projeto/carregar.js';
import { carregarNoWorkspace, projetoDoWorkspace } from '../auxiliares/salvar-blockly.js';

const PASTA = join(import.meta.dirname, 'casos');
const casos = readdirSync(PASTA)
  .filter((nome) => nome.endsWith('.json'))
  .sort()
  .map((arquivo) => ({ arquivo, caso: validarCaso(JSON.parse(readFileSync(join(PASTA, arquivo), 'utf8')), arquivo) }));

describe('arquivo → Carregar → meupia-core real (SC-001)', () => {
  let motor;

  beforeAll(async () => {
    motor = await criarMotorNode();
  });

  describe.each(casos)('$arquivo', ({ caso }) => {
    it('carregado, gera o mesmo Portugol e a mesma saída', async () => {
      const preparado = prepararCarregamento(textoArquivo(caso.projeto));
      expect(preparado.ok, preparado.mensagem).toBe(true);
      const ws = carregarNoWorkspace(preparado.projeto);
      const carregado = projetoDoWorkspace(ws, { ...preparado.projeto });
      ws.dispose();

      const resultadoPortugol = gerarPortugol(carregado);
      expect(resultadoPortugol).toEqual(gerarPortugol(caso.projeto));

      const resultado = await compilarEExecutar(motor, resultadoPortugol.codigo, caso.entrada);
      expect(resultado.status, resultado.erro?.mensagem).toBe(caso.statusEsperado ?? 'ok');
      expect(resultado.saida).toBe(caso.saidaEsperada);
    });
  });
});
