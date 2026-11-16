// Avisos nos blocos (fora da cobertura): bloco incompleto (RF-08, FR-005) e pilha fora do
// programa (RF-07; spec 007, FR-004). Cada tipo usa a sua chave no setWarningText, para que
// limpar um não apague o outro (contracts/editor.md). renderizarAvisos e destacarBloco
// são usados pela spec 009 (lista de avisos na Saída e destaque do bloco).

// workspace → (chave → ids marcados)
const marcadosPorWorkspace = new WeakMap();

export function aplicarAvisos(workspace, avisos, chave = 'incompleto') {
  const porChave = marcadosPorWorkspace.get(workspace) ?? new Map();
  marcadosPorWorkspace.set(workspace, porChave);
  const anteriores = porChave.get(chave) ?? new Set();
  const mensagensPorBloco = new Map();
  for (const aviso of avisos) {
    const lista = mensagensPorBloco.get(aviso.blocoId) ?? [];
    lista.push(aviso.mensagem);
    mensagensPorBloco.set(aviso.blocoId, lista);
  }

  for (const id of anteriores) {
    if (!mensagensPorBloco.has(id)) workspace.getBlockById(id)?.setWarningText(null, chave);
  }
  for (const [id, mensagens] of mensagensPorBloco) {
    workspace.getBlockById(id)?.setWarningText(mensagens.join('\n'), chave);
  }
  porChave.set(chave, new Set(mensagensPorBloco.keys()));
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
