// Ações de variável no workspace (RF-02; spec 002, research R-04 e R-06;
// contracts/editor-variaveis.md). Interface, fora da cobertura: as regras vêm do núcleo
// (validarNomeVariavel). Não chamam o gerador: as mudanças no mapa de variáveis disparam
// eventos não-UI, que já chegam ao atualizador em tempo real da 007.
import { validarNomeVariavel } from '../projeto/nome-variavel.js';
import { pedirVariavel } from './dialogo-variavel.js';
import { variaveisDoWorkspace } from './workspace.js';

// Botão "Criar variável…" da caixa de blocos (FR-001 a FR-003).
export async function criarVariavel(ws) {
  const lista = variaveisDoWorkspace(ws);
  const resposta = await pedirVariavel({ modo: 'criar', validar: (nome) => validarNomeVariavel(nome, lista) });
  if (!resposta) return;
  ws.getVariableMap().createVariable(resposta.nome, resposta.tipo);
}
