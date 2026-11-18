// Textos da tela escritos pelo JavaScript, todos em pt-BR (RF-01, RNF-03; spec 001, FR-003).
// Os textos fixos ficam no próprio index.html. Interface, fora da cobertura.

export const TEXTOS = Object.freeze({
  orientacaoSaida: 'Monte o programa com os blocos e clique em Executar para ver o resultado aqui.',
  copiaOk: 'Código copiado!',
  copiaFalhou: 'Não foi possível copiar. Selecione o código e use Ctrl+C.',
  novoTitulo: 'Começar um projeto novo?',
  novoMensagem: 'As alterações que não foram salvas serão perdidas.',
  novoConfirmar: 'Descartar e começar',
  cancelar: 'Cancelar',
  emBreve: 'Disponível em breve',
  // Botão Salvar (spec 011, contracts/tela-salvar.md); o mesmo texto do title no index.html.
  salvarDica: 'Salvar o projeto num arquivo .json',
  // Indicação ao lado do nome do programa (spec 011, História 2).
  alteracoesNaoSalvas: 'alterações não salvas',
  // Botão Carregar e confirmação de descarte (spec 012, contracts/tela-carregar.md).
  carregarDica: 'Carregar um projeto salvo (.json)',
  carregarTitulo: 'Carregar outro projeto?',
  carregarMensagem: 'As alterações que não foram salvas serão perdidas.',
  carregarConfirmar: 'Descartar e carregar',
  // Aviso de arquivo recusado (spec 012, História 2); as mensagens vêm de src/projeto/carregar.js.
  carregarFalhouTitulo: 'Não foi possível carregar',
  entendi: 'Entendi',
  // Diálogo de variável (spec 002, contracts/editor-variaveis.md).
  criarVariavelTitulo: 'Criar variável',
  criarVariavelBotao: 'Criar',
  renomearVariavelTitulo: (nome) => `Renomear a variável ${nome}`,
  renomearVariavelBotao: 'Renomear',
  tipoVariavelTitulo: (nome) => `Mudar o tipo de ${nome}`,
  tipoVariavelBotao: 'Mudar o tipo',
  // Menu do campo de variável (spec 002, T039).
  menuRenomearVariavel: 'Renomear variável…',
  menuMudarTipoVariavel: 'Mudar o tipo…',
  menuApagarVariavel: (nome) => `Apagar a variável “${nome}”`,
  // Ícones "+"/"−" do bloco escreva (spec 003, contracts/editor-entrada-saida.md).
  acrescentarValor: 'Acrescentar um valor',
  tirarValor: 'Tirar o último valor',
  // Ícone do bloco se (spec 004, contracts/editor-se.md).
  acrescentarSenao: 'Acrescentar senão',
  tirarSenao: 'Tirar o senão',
  // Confirmação ao tirar um senão com comandos (spec 004, História 2, cenário 2).
  tirarSenaoTitulo: 'Tirar o senão?',
  tirarSenaoConfirmar: 'Tirar o senão',
});
