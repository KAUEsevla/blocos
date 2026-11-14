// Bootstrap da página do meuPiá Blocos (fora da cobertura: interface).
// Tela de três painéis da spec 001; a atualização em tempo real completa é da 007.
import './estilos.css';
import { projetoVazio } from './projeto/formato.js';
import { assinaturaProjeto, haAlteracoes } from './projeto/alteracoes.js';
import { gerarPortugol } from './portugol/gerador.js';
import { criarWorkspace, recarregarBlocos, serializarBlocos, aoMudar } from './ui/workspace.js';
import { aplicarAvisos } from './ui/avisos-ui.js';
import { criarPainelSaida } from './ui/painel-saida.js';
import { ligarBarra, definirNome } from './ui/barra.js';
import { confirmar } from './ui/confirmacao.js';
import { TEXTOS } from './ui/textos.js';

const painelPortugol = document.getElementById('codigo-portugol');
const saida = criarPainelSaida(document.getElementById('saida'));

// Projeto aberto (data-model): o nome vem do campo, os blocos do workspace.
let projeto = projetoVazio();
const ws = criarWorkspace(document.getElementById('area-blocos'), projeto.blocos);

function projetoAtual() {
  return { ...projeto, blocos: serializarBlocos(ws) };
}

// A referência sai do projeto depois de carregado no workspace, nunca direto de
// projetoVazio(): o Blockly pode completar a serialização (research R-05).
let referencia = assinaturaProjeto(projetoAtual());

function atualizarPortugol() {
  const resultado = gerarPortugol(projetoAtual());
  painelPortugol.textContent = resultado.codigo;
  aplicarAvisos(ws, resultado.avisos);
}

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
  recarregarBlocos(ws, projeto.blocos);
  atualizarPortugol();
  saida.mostrarOrientacao();
  referencia = assinaturaProjeto(projetoAtual());
}

ligarBarra({
  aoMudarNome(nome) {
    // Valor bruto: o gerador saneia (sanearNomePrograma).
    projeto.nome = nome;
    atualizarPortugol();
  },
  aoNovo: novoProjeto,
});

aoMudar(ws, atualizarPortugol);
atualizarPortugol();
saida.mostrarOrientacao();
