// Pilhas soltas fora do programa (RF-07; spec 007, FR-003, FR-004;
// contracts/fora-do-programa.md; research R-04). Função pura sobre a serialização.
// Mesma regra de raiz do gerador: o primeiro "programa" é o programa; todo outro bloco de
// topo é o primeiro bloco de uma pilha solta. Não entra nos avisos de execução.

export const MENSAGEM_FORA_DO_PROGRAMA = 'Esta pilha está fora do programa';

export function blocosForaDoPrograma(blocos) {
  const topo = blocos?.blocks?.blocks;
  if (!Array.isArray(topo)) return [];

  const marcas = [];
  let raizEncontrada = false;
  for (const bloco of topo) {
    if (!raizEncontrada && bloco?.type === 'programa') {
      raizEncontrada = true;
      continue;
    }
    if (typeof bloco?.id !== 'string') continue;
    marcas.push({ blocoId: bloco.id, mensagem: MENSAGEM_FORA_DO_PROGRAMA });
  }
  return marcas;
}
