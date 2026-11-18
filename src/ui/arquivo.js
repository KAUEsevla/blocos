// Escolha e leitura do arquivo do Carregar (RF-12; spec 012, contracts/tela-carregar.md;
// research R-07). O arquivo é lido no navegador: nenhum envio a servidor (RNF-06).
// Interface, fora da cobertura.
import { TAMANHO_MAXIMO_ARQUIVO } from '../projeto/formato.js';

// Abre a janela de arquivos. Cancelar a janela não dispara "change": a promessa fica pendente,
// sem efeito (ninguém mais espera por ela). O value é zerado para o mesmo arquivo poder ser
// escolhido de novo.
export function escolherArquivo(input) {
  return new Promise((resolver) => {
    input.value = '';
    input.addEventListener('change', () => resolver(input.files?.[0] ?? null), { once: true });
    input.click();
  });
}

// Recusa arquivo grande antes de ler (data-model, "Motivo de recusa").
export async function lerTexto(arquivo) {
  if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) return { ok: false, motivo: 'grande-demais' };
  return { ok: true, texto: await arquivo.text() };
}
