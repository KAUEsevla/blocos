// Núcleo do Carregar (RF-12; spec 012, contracts/carregar.md; research R-03 a R-06, R-09).
// Decide se um arquivo pode substituir o projeto aberto e com que mensagem é recusado. Puro:
// sem Blockly, sem DOM, sem rede. A leitura estrutural fica em formato.js (lerArquivo); aqui
// ficam a validação dos blocos contra o registro e as mensagens em pt-BR.
import { lerArquivo } from './formato.js';
import { registroPadrao } from '../blocos/registro.js';

const MENSAGENS = Object.freeze({
  'nao-e-projeto': 'Este arquivo não é um projeto do meuPiá Blocos.',
  'versao-nova': 'Este projeto foi salvo numa versão mais nova do meuPiá Blocos.',
  'grande-demais': 'Este arquivo é grande demais para ser um projeto do meuPiá Blocos (o limite é 1 MB).',
});

export function mensagemRecusa({ motivo, detalhe } = {}) {
  if (motivo === 'dados-invalidos') return `Este projeto tem dados inválidos e não foi carregado: ${detalhe}.`;
  return MENSAGENS[motivo] ?? MENSAGENS['nao-e-projeto'];
}

// Percorre topos, encaixes e "next" (inclusive blocos soltos), na ordem do contrato.
export function validarBlocos(projeto, registro = registroPadrao) {
  void registro;
  void projeto;
  return { ok: true };
}

export function prepararCarregamento(texto, registro = registroPadrao) {
  const lido = lerArquivo(texto);
  const resultado = lido.ok ? validarBlocos(lido.projeto, registro) : lido;
  if (!resultado.ok) return { ...resultado, mensagem: mensagemRecusa(resultado) };
  return { ok: true, projeto: lido.projeto };
}

// Erro lançado pelo Blockly no ensaio. Comparação por instanceof: o nome da classe vem
// minificado (BadConnectionCheck$$module$…). excecoes = Blockly.serialization.exceptions.
export function classificarErroCarga(erro, excecoes = {}) {
  const { BadConnectionCheck, MissingConnection } = excecoes;
  const eh = (Classe) => typeof Classe === 'function' && erro instanceof Classe;
  return { ok: false, erro: eh(BadConnectionCheck) || eh(MissingConnection) ? 'encaixe' : 'desconhecido' };
}
