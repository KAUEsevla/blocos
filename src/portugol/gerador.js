// Gerador de Portugol (RF-08; contracts/gerador-portugol.md e registro-blocos.md).
// Função pura: projeto serializado → { codigo, avisos }. Não importa o Blockly e não toca o DOM.
import { criarEmissor } from './emissor.js';
import { MARCADOR_AUSENTE, criarAviso, criarAvisoComMensagem } from './avisos.js';
import { sanearNomePrograma } from './nome-programa.js';
import { gerarSecaoVar } from './variaveis.js';
import { registroPadrao } from '../blocos/registro.js';

function encontrarRaiz(blocos) {
  const topo = blocos?.blocks?.blocks;
  return Array.isArray(topo) ? topo.find((b) => b?.type === 'programa') : undefined;
}

export function gerarPortugol(projeto, registro = registroPadrao) {
  const variaveis = Array.isArray(projeto?.variaveis) ? projeto.variaveis : [];
  const variaveisPorId = new Map(variaveis.map((v) => [v.id, v]));
  const emissor = criarEmissor();
  const avisos = [];

  const blocoDesconhecido = (bloco) => {
    avisos.push(criarAvisoComMensagem({ bloco, encaixe: null, mensagem: `Bloco desconhecido: ${bloco.type}` }));
  };

  // Encaixe obrigatório vazio: aviso "Falta <parte> do bloco <rótulo>" e marcador no texto (FR-005).
  const parteAusente = (bloco, encaixe, parte) => {
    const rotulo = registro.obter(bloco.type)?.rotulo ?? bloco.type;
    avisos.push(criarAviso({ bloco, encaixe, parte, rotulo }));
    return MARCADOR_AUSENTE;
  };

  const gerarComando = (bloco) => {
    const entrada = registro.obter(bloco.type);
    if (!entrada || entrada.categoria !== 'comando') {
      blocoDesconhecido(bloco);
      emissor.linha(MARCADOR_AUSENTE);
      return;
    }
    entrada.gerar(bloco, ctx);
  };

  const gerarCadeia = (primeiro) => {
    for (let bloco = primeiro; bloco; bloco = bloco.next?.block) gerarComando(bloco);
  };

  const ctx = {
    linha(texto) {
      emissor.linha(texto);
    },
    comandos(bloco, encaixe) {
      emissor.entrar();
      gerarCadeia(bloco.inputs?.[encaixe]?.block);
      emissor.sair();
    },
    valor(bloco, encaixe, parte) {
      const filho = bloco.inputs?.[encaixe]?.block;
      if (!filho) return parteAusente(bloco, encaixe, parte);
      const entrada = registro.obter(filho.type);
      if (!entrada || entrada.categoria !== 'valor') {
        blocoDesconhecido(filho);
        return MARCADOR_AUSENTE;
      }
      return entrada.gerar(filho, ctx).codigo;
    },
    variavel(bloco, campo, parte) {
      const referencia = bloco.fields?.[campo];
      const id = referencia && typeof referencia === 'object' ? referencia.id : referencia;
      const variavel = variaveisPorId.get(id);
      return variavel ? variavel.nome : parteAusente(bloco, campo, parte);
    },
    campo(bloco, nome) {
      return bloco.fields?.[nome];
    },
    aviso(bloco, encaixe, mensagem) {
      avisos.push(criarAvisoComMensagem({ bloco, encaixe, mensagem }));
    },
  };

  emissor.linha(`algoritmo "${sanearNomePrograma(projeto?.nome)}"`);
  emissor.linhaEmBranco();
  gerarSecaoVar(variaveis, emissor);
  emissor.linha('inicio');
  const raiz = encontrarRaiz(projeto?.blocos);
  if (raiz) ctx.comandos(raiz, 'COMANDOS');
  emissor.linha('fim_algoritmo');

  return { codigo: emissor.texto(), avisos };
}
