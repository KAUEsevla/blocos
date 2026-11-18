// Salvar no caminho real (RF-11, RNF-07; spec 011, research R-09): cada caso de aceitação é
// carregado no Blockly como o editor carrega, salvo como o botão Salvar salva, lido de volta e
// executado no meupia-core real. A meta-aceitação da 008 garante que os casos cobrem todo par
// (tipo, variante): o Salvar passa por todas as variantes de todos os blocos.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { criarMotorNode } from './suporte/motor-node.js';
import { validarCaso } from './suporte/validar-caso.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { compilarEExecutar } from '../../src/core/executor-core.js';
import { carregarNoWorkspace, salvarELer } from '../auxiliares/salvar-blockly.js';

const PASTA = join(import.meta.dirname, 'casos');
const casos = readdirSync(PASTA)
  .filter((nome) => nome.endsWith('.json'))
  .sort()
  .map((arquivo) => ({ arquivo, caso: validarCaso(JSON.parse(readFileSync(join(PASTA, arquivo), 'utf8')), arquivo) }));

describe('Salvar → arquivo → meupia-core real (SC-001)', () => {
  let motor;

  beforeAll(async () => {
    motor = await criarMotorNode();
  });

  describe.each(casos)('$arquivo', ({ caso }) => {
    it('salvo e lido de volta, gera o mesmo Portugol e a mesma saída', async () => {
      const ws = carregarNoWorkspace(caso.projeto);
      const { salvo, lido } = salvarELer(ws, { ...caso.projeto });
      ws.dispose();

      expect(salvo.texto.startsWith('{\n  "formato": "meupia-blocos",\n  "versao": 1,')).toBe(true);
      const original = gerarPortugol(caso.projeto);
      const doArquivo = gerarPortugol(lido);
      expect(doArquivo).toEqual(original);

      const resultado = await compilarEExecutar(motor, doArquivo.codigo, caso.entrada);
      expect(resultado.status, resultado.erro?.mensagem).toBe(caso.statusEsperado ?? 'ok');
      expect(resultado.saida).toBe(caso.saidaEsperada);
    });
  });
});
