// Tipos dos encaixes (RF-06; SC-002 da spec 006; research R-08 a R-10;
// contracts/tipos-encaixe.md). Puro, sem Blockly: usado pelas definições, pela meta-aceitação
// e pela interface (verificador de encaixe, mudar o tipo, trocar a variável).
//
// O Core 1.4.1 não verifica tipos (research R-02, R-13): estes "check" são a única proteção
// contra lógico em lugar de número e vice-versa.

export const TIPO_VALOR = Object.freeze({ NUMERO: 'Numero', TEXTO: 'Texto', LOGICO: 'Logico' });

const CHECK_DO_TIPO = Object.freeze({
  inteiro: [TIPO_VALOR.NUMERO],
  real: [TIPO_VALOR.NUMERO],
  cadeia: [TIPO_VALOR.TEXTO],
  logico: [TIPO_VALOR.LOGICO],
});

// Tipo da variável → check; desconhecido ou ausente → null (qualquer).
export function checkDoTipoVariavel(tipo) {
  const check = Object.hasOwn(CHECK_DO_TIPO, tipo ?? '') ? CHECK_DO_TIPO[tipo] : undefined;
  return check ? [...check] : null;
}

// Regra do Blockly: null de qualquer lado é compatível; senão, precisa de um tipo em comum.
export function compativeis(checkA, checkB) {
  if (!checkA || !checkB) return true;
  return checkA.some((t) => checkB.includes(t));
}

const normalizar = (check) => {
  if (check === null || check === undefined) return null;
  return Array.isArray(check) ? [...check] : [check];
};

// O check que vale agora num ponto do bloco: 'saida' ou o nome de um encaixe.
export function checkEfetivo(entradaRegistro, ponto, tipoVariavel) {
  if (!entradaRegistro) return null;
  if (entradaRegistro.tipoPelaVariavel === ponto) return checkDoTipoVariavel(tipoVariavel);
  const definicao = entradaRegistro.definicao ?? {};
  if (ponto === 'saida') return normalizar(definicao.output);
  const encaixe = (definicao.args0 ?? []).find((a) => a?.type === 'input_value' && a.name === ponto);
  return normalizar(encaixe?.check);
}

const lerTipo = (tipos, id) => {
  if (id === undefined || id === null || !tipos) return undefined;
  return tipos instanceof Map ? tipos.get(id) : tipos[id];
};

// Pares { pai, encaixe, filho } em que a saída do filho não cabe no encaixe do pai.
// estado: o objeto `blocks` do Blockly ({ languageVersion, blocks: [...] }).
export function encaixesIncompativeis(estado, registro, tipos) {
  const pares = [];
  const tipoDe = (b) => lerTipo(tipos, b.fields?.VAR?.id);
  const visitar = (no) => {
    for (let atual = no; atual; atual = atual.next?.block) {
      const entradaPai = registro.obter(atual.type);
      for (const [encaixe, conteudo] of Object.entries(atual.inputs ?? {})) {
        const filho = conteudo?.block;
        if (!filho) continue;
        const checkPai = checkEfetivo(entradaPai, encaixe, tipoDe(atual));
        const checkFilho = checkEfetivo(registro.obter(filho.type), 'saida', tipoDe(filho));
        if (!compativeis(checkPai, checkFilho)) pares.push({ pai: atual.id, encaixe, filho: filho.id });
        visitar(filho);
      }
    }
  };
  for (const topo of estado?.blocks ?? []) visitar(topo);
  return pares;
}
