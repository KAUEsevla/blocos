// Avisos de bloco incompleto (RF-08, FR-005).

// Aparece no Portugol no lugar exato da parte que falta (R-06).
export const MARCADOR_AUSENTE = '???';

export function criarAviso({ bloco, encaixe, parte, rotulo }) {
  return criarAvisoComMensagem({ bloco, encaixe, mensagem: `Falta ${parte} do bloco ${rotulo}` });
}

export function criarAvisoComMensagem({ bloco, encaixe, mensagem }) {
  return { blocoId: bloco.id, tipoBloco: bloco.type, encaixe, mensagem };
}
