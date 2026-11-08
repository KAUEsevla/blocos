# Modelo de dados: Portugol válido para o Core

As entidades abaixo são objetos JavaScript simples (JSON-serializáveis). Nenhuma delas
depende do Blockly vivo nem do DOM.

## Projeto (entrada do gerador)

Forma em memória do projeto aberto, que é também o conteúdo do arquivo salvo (v1).

| Campo | Tipo | Regras |
| --- | --- | --- |
| `formato` | `"meupia-blocos"` | Constante. Só é exigido no arquivo (011/012); o gerador ignora. |
| `versao` | `1` | Versão do formato do arquivo. Só é exigido no arquivo. |
| `nome` | `string` | Nome do programa. O gerador aplica o saneamento de R-11 (vazio vira `MeuPrograma`, sem `"` nem `\`, de 1 a 40 caracteres). |
| `variaveis` | `Variavel[]` | Na ordem de criação. Pode ser vazia. |
| `blocos` | `object` | Saída de `Blockly.serialization.workspaces.save(ws)` (chave `blocks`; as variáveis ficam em `variaveis`). Pode ser `{}`. |

**Origem das variáveis**: `variaveis` é a fonte da seção `var`. Ao salvar, a 011 copia
nome/tipo/id das variáveis do workspace, e os blocos referenciam a variável pelo `id`
(campo `VAR` com `{ id }`, como o Blockly serializa).

### Variavel

| Campo | Tipo | Regras |
| --- | --- | --- |
| `id` | `string` | Id do Blockly; único no projeto. |
| `nome` | `string` | Regras da spec 002 (validadas pela 002 e pela 012; o gerador só emite). |
| `tipo` | `"inteiro" \| "real" \| "cadeia" \| "logico"` | Tipo do Portugol, sem acento. |

### Bloco (nó da serialização JSON do Blockly)

Só os campos que o gerador lê:

| Campo | Tipo | Uso |
| --- | --- | --- |
| `type` | `string` | Chave no registro de blocos (ver [contracts/registro-blocos.md](contracts/registro-blocos.md)). |
| `id` | `string` | Vai para o `Aviso.blocoId`. |
| `fields` | `object` | Valores dos campos (número, texto, operador, `{ id }` de variável). |
| `inputs` | `{ [nome]: { block?: Bloco } }` | Encaixes de valor e de comandos. Encaixe vazio = chave ausente ou sem `block`. |
| `next` | `{ block?: Bloco }` | Próximo comando da mesma área. |
| `extraState` | `object` | Estado de mutator (ex.: quantidade de valores do escreva, senão ligado). |

**Raiz**: o primeiro bloco de `blocos.blocks.blocks[]` com `type === "programa"`. Sua
área `inputs.COMANDOS` é o corpo do `inicio`. Os outros blocos de topo são soltos e
são ignorados.

## ResultadoGeracao (saída do gerador)

| Campo | Tipo | Regras |
| --- | --- | --- |
| `codigo` | `string` | Texto Portugol completo, com LF e terminado em `\n`. Com avisos, contém `???` nos lugares das partes ausentes. |
| `avisos` | `Aviso[]` | Na ordem em que aparecem no texto. Lista vazia quando o programa está completo. |

**Invariantes**:
- `avisos.length === 0` ⇒ `codigo` não contém `???` e é aceito pelo Core (FR-001).
- `avisos.length > 0` ⇒ `codigo` contém pelo menos um `???`.
- Mesma entrada (comparando o JSON) ⇒ mesmo `codigo` e mesmos `avisos` (FR-004).

### Aviso (aviso de bloco incompleto)

| Campo | Tipo | Regras |
| --- | --- | --- |
| `blocoId` | `string` | Id do bloco incompleto. Usado para marcar e destacar o bloco (História 2). |
| `tipoBloco` | `string` | `type` do bloco. |
| `encaixe` | `string` | Nome do encaixe ou campo que falta (ex.: `CONDICAO`). |
| `mensagem` | `string` | pt-BR: `Falta <parte> do bloco <nome>` (ex.: "Falta a condição do bloco se"). Algumas regras específicas, como passo 0 na 005, podem trazer mensagem própria. |

Um mesmo bloco pode gerar mais de um aviso (ex.: `para` sem variável e sem limite).

## VerificacaoExecucao

Resultado de `verificarExecucao(resultadoGeracao)`, que a spec 009 consulta antes de
rodar:

| Campo | Tipo | Regras |
| --- | --- | --- |
| `permitida` | `boolean` | `true` só se `avisos` estiver vazio. |
| `motivo` | `string \| null` | Com bloqueio: "O programa tem blocos incompletos. Complete-os para executar." |
| `avisos` | `Aviso[]` | Os mesmos do resultado, para listar na Saída. |

## ResultadoExecucao (adapter do Core)

Ver [contracts/executor-core.md](contracts/executor-core.md).

| Campo | Tipo | Regras |
| --- | --- | --- |
| `status` | `"ok" \| "erro_compilacao" \| "erro_execucao"` | Distingue os dois tipos de erro (base para a spec 009). |
| `saida` | `string` | O que o programa escreveu (uma linha por `escreva`, com `\n`). |
| `erro` | `ErroCore \| null` | Preenchido nos dois status de erro. |

### ErroCore

| Campo | Tipo | Regras |
| --- | --- | --- |
| `mensagem` | `string` | Mensagem em pt-BR para o estudante, sem stack trace. |
| `etapa` | `"léxico" \| "sintático" \| "semântico" \| "execução" \| null` | Extraída do texto do Core. |
| `linha`, `coluna` | `number \| null` | Posição no Portugol, quando o Core informa. |
| `detalhe` | `string` | Texto técnico original (saída do compilador ou tipo e mensagem da exceção Python), para exibição secundária. |

## CasoAceitacao (arquivo em `tests/aceitacao/casos/*.json`)

Schema em [contracts/caso-aceitacao.schema.json](contracts/caso-aceitacao.schema.json).

| Campo | Tipo | Regras |
| --- | --- | --- |
| `descricao` | `string` | O que o caso verifica, em pt-BR. |
| `requisitos` | `string[]` | IDs atendidos (ex.: `["RF-08", "RNF-07"]`). |
| `projeto` | `Projeto` (arquivo v1 completo) | O mesmo JSON que o botão Salvar produz. |
| `entrada` | `string[]` | Uma linha por `leia`, na ordem. Pode ser vazia. |
| `portugolEsperado` | `string` (opcional) | Quando presente, o texto gerado deve ser idêntico (caracteres e indentação). |
| `saidaEsperada` | `string` | Saída exata do programa. |
| `statusEsperado` | `"ok" \| "erro_execucao"` (padrão `"ok"`) | Permite casos como divisão por zero. `erro_compilacao` nunca é esperado (SC-003). |

**Regras da suíte**:
- Todo caso precisa gerar `avisos.length === 0`; um caso com aviso falha o teste.
- A meta-verificação de SC-002 exige que cada `type` registrado no registro de blocos
  apareça em pelo menos um `projeto` de algum caso.

## Transições de estado

O gerador não tem estado próprio. O ciclo relevante é o do programa na interface:

```text
editando ──(gerar)──▶ com avisos ──(completar blocos)──▶ completo
                          │                                  │
                  Executar bloqueado                Executar permitido (009)
                  (Saída lista avisos)                       │
                                                     executando ──▶ ok | erro_compilacao | erro_execucao
```
