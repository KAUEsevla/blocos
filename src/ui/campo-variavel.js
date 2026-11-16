// Campo de variável próprio, "campo_variavel" (RF-02; spec 002, research R-05;
// contracts/editor-variaveis.md). Estende o FieldVariable do Blockly 12.5.1.
// Interface, fora da cobertura: as regras ficam no núcleo (src/projeto/, src/blocos/).
//
// Campo sem variável: o FieldVariable padrão cria uma variável "item" no initModel(). Aqui
// o campo fica vazio e mostra "???" (o gerador já avisa "Falta a variável …"). Por isso
// saveState() e dropdownCreate(), que no padrão supõem uma variável, também são cobertos.
//
// Menu próprio (T039, research R-06): as variáveis e, no fim, "Renomear variável…",
// "Mudar o tipo…" e "Apagar a variável", tratados por acoes-variavel.js, sem
// window.prompt, window.confirm nem as mensagens RENAME_VARIABLE/DELETE_VARIABLE do Blockly.
import * as Blockly from 'blockly';
import { MARCADOR_AUSENTE } from '../portugol/avisos.js';
import { TEXTOS } from './textos.js';
import { renomearVariavel, mudarTipoVariavel, apagarVariavel } from './acoes-variavel.js';
import { registroPadrao } from '../blocos/registro.js';
import { checkEfetivo, compativeis } from '../blocos/tipos.js';
import { checkDaConexao } from './verificador-encaixe.js';

export const TIPO_CAMPO_VARIAVEL = 'campo_variavel';

const RENOMEAR = 'MEUPIA_RENOMEAR_VARIAVEL';
const MUDAR_TIPO = 'MEUPIA_MUDAR_TIPO_VARIAVEL';
const APAGAR = 'MEUPIA_APAGAR_VARIAVEL';
const ACOES = { [RENOMEAR]: renomearVariavel, [MUDAR_TIPO]: mudarTipoVariavel, [APAGAR]: apagarVariavel };

export class CampoVariavel extends Blockly.FieldVariable {
  constructor(...args) {
    super(...args);
    // O construtor do FieldVariable aponta para o menu da classe base, não da subclasse.
    this.menuGenerator_ = CampoVariavel.dropdownCreate;
  }

  // Não cria variável: só exige o bloco, como o original.
  initModel() {
    if (!this.getSourceBlock()) throw new Blockly.UnattachedFieldError();
  }

  getText() {
    return this.getVariable() ? super.getText() : MARCADOR_AUSENTE;
  }

  saveState(incluirNome) {
    if (!this.getVariable()) return null;
    return super.saveState(incluirNome);
  }

  // Precisa existir junto com o fromXml próprio: sem ele, o Blockly trata o campo como
  // "legado" e passa a carregar o JSON pelo XML.
  loadState(estado) {
    if (!estado || (!estado.id && !estado.name)) return;
    super.loadState(estado);
  }

  // O evento de criação do bloco serializa em XML: campo vazio vira <field> sem conteúdo.
  toXml(elemento) {
    if (!this.getVariable()) return elemento;
    return super.toXml(elemento);
  }

  fromXml(elemento) {
    if (!elemento.getAttribute('id') && !elemento.textContent) return;
    super.fromXml(elemento);
  }

  // Uma variável escolhida passa por trocarVariavelDoBloco (spec 006, research R-10). Os três
  // itens próprios chamam as ações no workspace principal (o bloco pode estar na caixa de
  // blocos, cujo workspace é outro).
  onItemSelected_(menu, item) {
    const acao = ACOES[item.getValue()];
    if (!acao) {
      trocarVariavelDoBloco(this.getSourceBlock(), item.getValue());
      return;
    }
    const bloco = this.getSourceBlock();
    const variavel = this.getVariable();
    if (!bloco || bloco.isDeadOrDying() || !variavel) return;
    const ws = bloco.workspace.isFlyout ? bloco.workspace.targetWorkspace : bloco.workspace;
    acao(ws, variavel.getId());
  }

  static fromJson(opcoes) {
    const nome = Blockly.utils.parsing.replaceMessageReferences(opcoes.variable);
    return new this(nome || null, undefined, undefined, undefined, opcoes);
  }
}

// Menu: as variáveis dos tipos aceitos, por nome (como o padrão); com uma variável escolhida,
// os três itens próprios no fim. Sem variável, só a lista (o padrão lança erro nesse caso).
CampoVariavel.dropdownCreate = function dropdownCreate() {
  const ws = this.getSourceBlock()?.workspace;
  const tipos = Array.isArray(this.variableTypes) ? this.variableTypes : [];
  const opcoes = (ws ? ws.getVariableMap().getAllVariables() : [])
    .filter((v) => tipos.length === 0 || tipos.includes(v.getType()))
    .sort(Blockly.Variables.compareByName)
    .map((v) => [v.getName(), v.getId()]);
  const variavel = this.getVariable();
  if (!variavel) return opcoes.length > 0 ? opcoes : [[MARCADOR_AUSENTE, '']];
  return [
    ...opcoes,
    [TEXTOS.menuRenomearVariavel, RENOMEAR],
    [TEXTOS.menuMudarTipoVariavel, MUDAR_TIPO],
    [TEXTOS.menuApagarVariavel(variavel.getName()), APAGAR],
  ];
};

let registrado = false;

// Idempotente: o registro de campos do Blockly lança erro com nome repetido.
export function registrarCampoVariavel() {
  if (registrado) return;
  Blockly.fieldRegistry.register(TIPO_CAMPO_VARIAVEL, CampoVariavel);
  registrado = true;
}

// Distância com que um bloco desencaixado é afastado, para ficar visível como solto.
const AFASTAR = 24;

const soltar = (bloco) => {
  bloco.unplug();
  bloco.moveBy(AFASTAR, AFASTAR);
};

// Troca a variável do campo VAR soltando antes o que ficaria em encaixe incompatível (spec 006,
// research R-10; contracts/editor-operadores.md): o próprio bloco, se a saída nova não cabe no
// encaixe do pai, e o valor encaixado no ponto tipoPelaVariavel (o VALOR do recebe). Tudo num
// grupo de eventos, e nessa ordem: soltar → aplicar. Assim um Ctrl+Z volta a variável e só
// depois reencaixa, quando o encaixe já é compatível de novo.
export function trocarVariavelDoBloco(bloco, idNova) {
  const campo = bloco?.getField('VAR');
  if (!campo) return;
  const tipoNovo = bloco.workspace.getVariableMap().getVariableById(idNova)?.getType();
  const entrada = registroPadrao.obter(bloco.type);
  Blockly.Events.setGroup(true);
  try {
    const conexaoPai = bloco.outputConnection?.targetConnection;
    if (conexaoPai && !compativeis(checkDaConexao(conexaoPai), checkEfetivo(entrada, 'saida', tipoNovo))) {
      soltar(bloco);
    }
    const ponto = entrada?.tipoPelaVariavel;
    const filho = ponto && ponto !== 'saida' ? bloco.getInput(ponto)?.connection?.targetBlock() : null;
    if (filho && !compativeis(checkEfetivo(entrada, ponto, tipoNovo), checkDaConexao(filho.outputConnection))) {
      soltar(filho);
    }
    campo.setValue(idNova);
  } finally {
    Blockly.Events.setGroup(false);
  }
}
