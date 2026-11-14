// Bootstrap da página do meuPiá Blocos (fora da cobertura: interface).
// A tela de três painéis completa chega na spec 001; a atualização em tempo real completa, na 007.
import './estilos.css';
import { projetoVazio } from './projeto/formato.js';
import { gerarPortugol } from './portugol/gerador.js';
import { criarWorkspace, serializarBlocos, aoMudar } from './ui/workspace.js';
import { aplicarAvisos } from './ui/avisos-ui.js';

const projeto = projetoVazio();
const painelPortugol = document.getElementById('codigo-portugol');
const ws = criarWorkspace(document.getElementById('area-blocos'), projeto.blocos);

function atualizarPortugol() {
  const resultado = gerarPortugol({ ...projeto, blocos: serializarBlocos(ws) });
  painelPortugol.textContent = resultado.codigo;
  aplicarAvisos(ws, resultado.avisos);
}

aoMudar(ws, atualizarPortugol);
atualizarPortugol();
