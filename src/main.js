// Bootstrap da página do meuPiá Blocos (fora da cobertura: interface).
// Tela de três painéis da spec 001, com o Portugol em tempo real da spec 007: o
// atualizador do núcleo decide quando gerar (contracts/editor.md, seção src/main.js).
// Spec 002: as variáveis vêm do mapa do workspace a cada geração; criar, renomear e apagar
// variável disparam eventos não-UI, que já chegam ao tempoReal.notificar (research R-04).
import './estilos.css';
import { projetoVazio } from './projeto/formato.js';
import { assinaturaProjeto, haAlteracoes } from './projeto/alteracoes.js';
import { gerarPortugol } from './portugol/gerador.js';
import { criarAtualizacaoTempoReal } from './portugol/tempo-real.js';
import { blocosForaDoPrograma } from './portugol/fora-do-programa.js';
import {
  criarWorkspace,
  recarregarBlocos,
  serializarBlocos,
  variaveisDoWorkspace,
  ouvirEventos,
  desfazer,
  refazer,
  estadoDesfazer,
} from './ui/workspace.js';
import { ligarBotoesDesfazer, atualizarBotoesDesfazer } from './ui/barra-blocos.js';
import { aplicarAvisos } from './ui/avisos-ui.js';
import { criarPainelSaida } from './ui/painel-saida.js';
import { mostrarCodigo, copiarCodigo } from './ui/painel-portugol.js';
import { ligarBarra, definirNome } from './ui/barra.js';
import { confirmar } from './ui/confirmacao.js';
import { TEXTOS } from './ui/textos.js';

const preCodigo = document.getElementById('codigo-portugol');
const mensagemCopia = document.getElementById('mensagem-copia');
const saida = criarPainelSaida(document.getElementById('saida'));

// Projeto aberto (data-model): o nome vem do campo; variáveis e blocos, do workspace.
let projeto = projetoVazio();
const ws = criarWorkspace(document.getElementById('area-blocos'), projeto);
let ultimoCodigo = '';

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
  mostrarCodigo(preCodigo, resultado.codigo);
  aplicarAvisos(ws, resultado.avisos, 'incompleto');
  // A marca de pilha solta não entra em resultado.avisos: não bloqueia Executar (R-04).
  aplicarAvisos(ws, blocosForaDoPrograma(projetoGerado.blocos), 'fora-do-programa');
  atualizarBotoesDesfazer(estadoDesfazer(ws));
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
  projeto = projetoVazio();
  definirNome(projeto.nome);
  recarregarBlocos(ws, projeto);
  tempoReal.atualizarAgora();
  saida.mostrarOrientacao();
  referencia = assinaturaProjeto(projetoAtual());
}

ligarBarra({
  aoMudarNome(nome) {
    // Valor bruto: o gerador saneia (sanearNomePrograma).
    projeto.nome = nome;
    tempoReal.solicitar();
  },
  aoNovo: novoProjeto,
});

document.getElementById('botao-copiar').addEventListener('click', () => {
  copiarCodigo(ultimoCodigo, { pre: preCodigo, mensagem: mensagemCopia });
});

ligarBotoesDesfazer({
  aoDesfazer: () => desfazer(ws),
  aoRefazer: () => refazer(ws),
});

ouvirEventos(ws, tempoReal.notificar);
tempoReal.atualizarAgora();
saida.mostrarOrientacao();
