// Campo de variável próprio, "campo_variavel" (RF-02; spec 002, research R-05;
// contracts/editor-variaveis.md). Estende o FieldVariable do Blockly 12.5.1.
// Interface, fora da cobertura: as regras ficam no núcleo (src/projeto/, src/blocos/).
//
// Campo sem variável: o FieldVariable padrão cria uma variável "item" no initModel(). Aqui
// o campo fica vazio e mostra "???" (o gerador já avisa "Falta a variável …"). Por isso
// saveState() e dropdownCreate(), que no padrão supõem uma variável, também são cobertos.
import * as Blockly from 'blockly';
import { MARCADOR_AUSENTE } from '../portugol/avisos.js';

export const TIPO_CAMPO_VARIAVEL = 'campo_variavel';

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

  static fromJson(opcoes) {
    const nome = Blockly.utils.parsing.replaceMessageReferences(opcoes.variable);
    return new this(nome || null, undefined, undefined, undefined, opcoes);
  }
}

// Sem variável escolhida, o menu lista as variáveis dos tipos aceitos (o padrão lança erro).
const menuPadrao = Blockly.FieldVariable.dropdownCreate;
CampoVariavel.dropdownCreate = function dropdownCreate() {
  if (this.getVariable()) return menuPadrao.call(this);
  const ws = this.getSourceBlock()?.workspace;
  const tipos = Array.isArray(this.variableTypes) ? this.variableTypes : [];
  const opcoes = (ws ? ws.getVariableMap().getAllVariables() : [])
    .filter((v) => tipos.length === 0 || tipos.includes(v.getType()))
    .sort(Blockly.Variables.compareByName)
    .map((v) => [v.getName(), v.getId()]);
  return opcoes.length > 0 ? opcoes : [[MARCADOR_AUSENTE, '']];
};

let registrado = false;

// Idempotente: o registro de campos do Blockly lança erro com nome repetido.
export function registrarCampoVariavel() {
  if (registrado) return;
  Blockly.fieldRegistry.register(TIPO_CAMPO_VARIAVEL, CampoVariavel);
  registrado = true;
}
