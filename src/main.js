// Bootstrap da página do meuPiá Blocos (fora da cobertura: interface).
// Tela de três painéis da spec 001, com o Portugol em tempo real da spec 007: o
// atualizador do núcleo decide quando gerar (contracts/editor.md, seção src/main.js).
// Spec 002: as variáveis vêm do mapa do workspace a cada geração; criar, renomear e apagar
// variável disparam eventos não-UI, que já chegam ao tempoReal.notificar (research R-04).
// Spec 009: Executar e Parar pelo controlador de src/execucao/, com o Core num Web Worker
// (contracts/tela-execucao.md, seção "Ligação").
// Spec 010: o programa a executar leva as variáveis (nome e tipo) para o pedido do leia
// (contracts/tela-entrada.md, seção "Ligação").
// Spec 011: Salvar baixa o projeto em .json e marca a referência de "salvo" com a assinatura
// do mesmo objeto gravado; o Novo não pergunta até a próxima alteração (contracts/tela-salvar.md).
// Spec 012: Carregar lê e valida o arquivo inteiro antes de mexer no projeto aberto, pede
// confirmação como o Novo e gera o Portugol junto com os blocos (contracts/tela-carregar.md).
import './estilos.css';
import { projetoVazio } from './projeto/formato.js';
import { assinaturaProjeto, haAlteracoes } from './projeto/alteracoes.js';
import { prepararSalvamento } from './projeto/salvar.js';
import { prepararCarregamento, mensagemRecusa, recusaDoEnsaio } from './projeto/carregar.js';
import { gerarPortugol } from './portugol/gerador.js';
import { criarAtualizacaoTempoReal } from './portugol/tempo-real.js';
import { blocosForaDoPrograma } from './portugol/fora-do-programa.js';
import {
  criarWorkspace,
  recarregarBlocos,
  ensaiarCarga,
  serializarBlocos,
  variaveisDoWorkspace,
  ouvirEventos,
  desfazer,
  refazer,
  estadoDesfazer,
} from './ui/workspace.js';
import { ligarBotoesDesfazer, atualizarBotoesDesfazer } from './ui/barra-blocos.js';
import { aplicarAvisos, destacarBloco } from './ui/avisos-ui.js';
import { criarPainelSaida } from './ui/painel-saida.js';
import { mostrarCodigo, copiarCodigo } from './ui/painel-portugol.js';
import { ligarBarra, definirNome, mostrarEstadoExecucao, mostrarAlteracoes } from './ui/barra.js';
import { criarExecutor } from './execucao/executor.js';
import { criarControladorExecucao } from './execucao/controlador.js';
import { confirmar, avisar } from './ui/confirmacao.js';
import { baixarArquivo } from './ui/download.js';
import { escolherArquivo, lerTexto } from './ui/arquivo.js';
import { TEXTOS } from './ui/textos.js';

const preCodigo = document.getElementById('codigo-portugol');
const mensagemCopia = document.getElementById('mensagem-copia');
const saida = criarPainelSaida(document.getElementById('saida'));

// Projeto aberto (data-model): o nome vem do campo; variáveis e blocos, do workspace.
let projeto = projetoVazio();
const ws = criarWorkspace(document.getElementById('area-blocos'), projeto);
let ultimoCodigo = '';
let ultimosAvisos = [];
let ultimasVariaveis = [];

function projetoAtual() {
  return { ...projeto, variaveis: variaveisDoWorkspace(ws), blocos: serializarBlocos(ws) };
}

// A referência sai do projeto depois de carregado no workspace, nunca direto de
// projetoVazio(): o Blockly pode completar a serialização (research R-05).
let referencia = assinaturaProjeto(projetoAtual());

function atualizarPortugol() {
  const projetoGerado = projetoAtual();
  const resultado = gerarPortugol(projetoGerado);
  ultimoCodigo = resultado.codigo;
  ultimosAvisos = resultado.avisos;
  ultimasVariaveis = projetoGerado.variaveis.map(({ nome, tipo }) => ({ nome, tipo }));
  mostrarCodigo(preCodigo, resultado.codigo);
  aplicarAvisos(ws, resultado.avisos, 'incompleto');
  // A marca de pilha solta não entra em resultado.avisos: não bloqueia Executar (R-04).
  aplicarAvisos(ws, blocosForaDoPrograma(projetoGerado.blocos), 'fora-do-programa');
  atualizarBotoesDesfazer(estadoDesfazer(ws));
  // Spec 011 (FR-006): toda geração reavalia as alterações não salvas.
  mostrarAlteracoes(haAlteracoes(projetoGerado, referencia));
}

const tempoReal = criarAtualizacaoTempoReal({
  atualizar: atualizarPortugol,
  agendar: (fn) => requestAnimationFrame(fn),
});

async function novoProjeto() {
  if (haAlteracoes(projetoAtual(), referencia)) {
    const descartar = await confirmar({
      titulo: TEXTOS.novoTitulo,
      mensagem: TEXTOS.novoMensagem,
      confirmar: TEXTOS.novoConfirmar,
      cancelar: TEXTOS.cancelar,
    });
    if (!descartar) return;
  }
  // Um projeto novo não herda uma execução em andamento (contracts/tela-execucao.md).
  await controlador.parar();
  projeto = projetoVazio();
  definirNome(projeto.nome);
  recarregarBlocos(ws, projeto);
  tempoReal.atualizarAgora();
  saida.mostrarOrientacao();
  referencia = assinaturaProjeto(projetoAtual());
  mostrarAlteracoes(false);
}

// Salvar não muda o projeto aberto (FR-005): nem workspace, nem desfazer, nem nome, nem Saída,
// nem a execução em andamento. Só a referência de "salvo".
function salvarProjeto() {
  tempoReal.atualizarAgora();
  const { nomeArquivo, texto, referencia: salvo } = prepararSalvamento(projetoAtual());
  baixarArquivo(nomeArquivo, texto);
  referencia = salvo;
  mostrarAlteracoes(false);
}

// Carregar (spec 012, contracts/tela-carregar.md; research R-07, R-08). Nada antes de
// "anterior = projetoAtual()" muda o projeto aberto, o nome, a Saída, a execução, o desfazer ou
// a referência (FR-004).
function avisarRecusa(mensagem) {
  return avisar({ titulo: TEXTOS.carregarFalhouTitulo, mensagem, ok: TEXTOS.entendi });
}

async function carregarProjeto() {
  const arquivo = await escolherArquivo(document.getElementById('arquivo-carregar'));
  if (!arquivo) return;
  const lido = await lerTexto(arquivo);
  let preparado = lido.ok ? prepararCarregamento(lido.texto) : { ok: false, mensagem: mensagemRecusa(lido) };
  if (preparado.ok) {
    const ensaio = ensaiarCarga(preparado.projeto);
    if (!ensaio.ok) preparado = recusaDoEnsaio(ensaio);
  }
  if (!preparado.ok) {
    await avisarRecusa(preparado.mensagem);
    return;
  }
  tempoReal.atualizarAgora();
  if (haAlteracoes(projetoAtual(), referencia)) {
    const descartar = await confirmar({
      titulo: TEXTOS.carregarTitulo,
      mensagem: TEXTOS.carregarMensagem,
      confirmar: TEXTOS.carregarConfirmar,
      cancelar: TEXTOS.cancelar,
    });
    if (!descartar) return;
  }
  const anterior = projetoAtual();
  // Um projeto carregado não herda uma execução em andamento (contracts/tela-execucao.md).
  await controlador.parar();
  projeto = { ...preparado.projeto };
  definirNome(projeto.nome);
  try {
    recarregarBlocos(ws, projeto);
  } catch (erro) {
    // Última defesa (research R-08): volta ao projeto que estava aberto.
    console.warn(erro);
    projeto = anterior;
    definirNome(anterior.nome);
    recarregarBlocos(ws, anterior);
    tempoReal.atualizarAgora();
    await avisarRecusa(mensagemRecusa({ motivo: 'dados-invalidos', detalhe: 'o editor não conseguiu montar os blocos' }));
    return;
  }
  // O Portugol aparece junto com os blocos (spec 007).
  tempoReal.atualizarAgora();
  saida.mostrarOrientacao();
  referencia = assinaturaProjeto(projetoAtual());
  mostrarAlteracoes(false);
}

// O worker é criado no primeiro clique em Executar (research R-02, R-06).
const executor = criarExecutor({
  criarWorker: () => new Worker(new URL('./execucao/worker.js', import.meta.url), { type: 'module' }),
});

const controlador = criarControladorExecucao({
  // Força a geração pendente: o código executado é o que o painel mostra (FR-001).
  obterPrograma: () => {
    tempoReal.atualizarAgora();
    return { codigo: ultimoCodigo, avisos: ultimosAvisos, variaveis: ultimasVariaveis };
  },
  executor,
  saida,
  destacar: (blocoId) => destacarBloco(ws, blocoId),
  aoMudarEstado: mostrarEstadoExecucao,
});

ligarBarra({
  aoMudarNome(nome) {
    // Valor bruto: o gerador saneia (sanearNomePrograma).
    projeto.nome = nome;
    tempoReal.solicitar();
  },
  aoNovo: novoProjeto,
  aoExecutar: () => controlador.executar(),
  aoParar: () => controlador.parar(),
  aoSalvar: salvarProjeto,
  aoCarregar: carregarProjeto,
});

document.getElementById('botao-copiar').addEventListener('click', () => {
  copiarCodigo(ultimoCodigo, { pre: preCodigo, mensagem: mensagemCopia });
});

ligarBotoesDesfazer({
  aoDesfazer: () => desfazer(ws),
  aoRefazer: () => refazer(ws),
});

// Confirmação ao fechar ou recarregar com alterações não salvas (spec 011, FR-006). O texto do
// diálogo é do navegador e não pode ser trocado (plan, acompanhamento de complexidade).
window.addEventListener('beforeunload', (evento) => {
  if (!haAlteracoes(projetoAtual(), referencia)) return;
  evento.preventDefault();
  evento.returnValue = '';
});

ouvirEventos(ws, tempoReal.notificar);
tempoReal.atualizarAgora();
saida.mostrarOrientacao();
mostrarEstadoExecucao('ocioso');
