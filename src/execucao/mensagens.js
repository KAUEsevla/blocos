// Textos da execução e relato do resultado (spec 009, contracts/executar.md; research R-06,
// R-07, R-10). Núcleo: todos os textos que a execução mostra na Saída, em pt-BR (RNF-03).
// relatoDoResultado devolve os itens do aviso de fim; as linhas do programa já foram
// escritas em fluxo.

export const MENSAGENS_EXECUCAO = Object.freeze({
  preparando: 'Preparando o ambiente do meuPiá. Na primeira vez isso pode levar até 30 segundos.',
  etapaPython: 'Carregando o Python (1 de 2)...',
  etapaCore: 'Instalando o meuPiá Core (2 de 2)...',
  executando: 'Executando...',
  fim: 'Fim do programa',
  erroCompilacao: 'Erro de compilação',
  erroExecucao: 'Erro de execução',
  interrompido: 'Execução interrompida pelo usuário',
  linhaDoErro: (n, texto) => `Linha ${n}: ${texto}`,
  detalhesTecnicos: 'Detalhes técnicos',
});

function erroComTitulo(titulo, erro) {
  return [
    { texto: titulo, tipo: 'erro' },
    { texto: erro?.mensagem ?? '', tipo: 'erro' },
  ];
}

// O rastro técnico só vai para "Detalhes técnicos", e só quando existe (R-07).
function comDetalhe(itens, erro) {
  return erro?.detalhe ? [...itens, { detalhe: erro.detalhe }] : itens;
}

// "Linha L: <texto>" da linha do Portugol que o Core apontou, sem a indentação (cenário 1
// da História 2). Fora do código, nada.
function linhaDoCodigo(codigo, linha) {
  if (!Number.isInteger(linha) || linha < 1) return [];
  const texto = String(codigo ?? '').split('\n')[linha - 1];
  if (texto === undefined) return [];
  return [{ texto: MENSAGENS_EXECUCAO.linhaDoErro(linha, texto.trim()), tipo: 'erro' }];
}

export function relatoDoResultado(resultado, codigo = '') {
  const { status, erro } = resultado ?? {};
  switch (status) {
    case 'ok':
      return [{ texto: MENSAGENS_EXECUCAO.fim, tipo: 'sistema' }];
    case 'interrompido':
      return [{ texto: MENSAGENS_EXECUCAO.interrompido, tipo: 'sistema' }];
    case 'falha_ambiente':
      return [{ texto: erro?.mensagem ?? '', tipo: 'erro' }];
    case 'erro_compilacao':
      return comDetalhe(
        [...erroComTitulo(MENSAGENS_EXECUCAO.erroCompilacao, erro), ...linhaDoCodigo(codigo, erro?.linha)],
        erro,
      );
    default:
      // erro_execucao e qualquer status inesperado.
      return comDetalhe(erroComTitulo(MENSAGENS_EXECUCAO.erroExecucao, erro), erro);
  }
}
