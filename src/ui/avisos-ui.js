// Avisos de bloco incompleto na interface (RF-08, FR-005; fora da cobertura).
// aplicarAvisos marca os blocos; renderizarAvisos e destacarBloco ficam prontos para a spec 009.

const marcadosPorWorkspace = new WeakMap();

export function aplicarAvisos(workspace, avisos) {
  const anteriores = marcadosPorWorkspace.get(workspace) ?? new Set();
  const mensagensPorBloco = new Map();
  for (const aviso of avisos) {
    const lista = mensagensPorBloco.get(aviso.blocoId) ?? [];
    lista.push(aviso.mensagem);
    mensagensPorBloco.set(aviso.blocoId, lista);
  }

  for (const id of anteriores) {
    if (!mensagensPorBloco.has(id)) workspace.getBlockById(id)?.setWarningText(null);
  }
  for (const [id, mensagens] of mensagensPorBloco) {
    workspace.getBlockById(id)?.setWarningText(mensagens.join('\n'));
  }
  marcadosPorWorkspace.set(workspace, new Set(mensagensPorBloco.keys()));
}

export function renderizarAvisos(container, avisos, aoClicar) {
  const lista = document.createElement('ul');
  lista.className = 'lista-avisos';
  for (const aviso of avisos) {
    const item = document.createElement('li');
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.textContent = aviso.mensagem;
    botao.addEventListener('click', () => aoClicar(aviso));
    item.append(botao);
    lista.append(item);
  }
  container.replaceChildren(lista);
}

export function destacarBloco(workspace, blocoId) {
  const bloco = workspace.getBlockById(blocoId);
  if (!bloco) return;
  bloco.select();
  workspace.centerOnBlock(blocoId);
}
