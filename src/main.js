// Bootstrap da página do meuPiá Blocos (fora da cobertura: interface).
// Tela de três painéis da spec 001; a atualização em tempo real completa é da 007.
import './estilos.css';
import { projetoVazio } from './projeto/formato.js';
import { gerarPortugol } from './portugol/gerador.js';
import { criarWorkspace, serializarBlocos, aoMudar } from './ui/workspace.js';
import { aplicarAvisos } from './ui/avisos-ui.js';
import { criarPainelSaida } from './ui/painel-saida.js';

const projeto = projetoVazio();
const painelPortugol = document.getElementById('codigo-portugol');
const saida = criarPainelSaida(document.getElementById('saida'));
const ws = criarWorkspace(document.getElementById('area-blocos'), projeto.blocos);

function atualizarPortugol() {
  const resultado = gerarPortugol({ ...projeto, blocos: serializarBlocos(ws) });
  painelPortugol.textContent = resultado.codigo;
  aplicarAvisos(ws, resultado.avisos);
}

aoMudar(ws, atualizarPortugol);
atualizarPortugol();
saida.mostrarOrientacao();
