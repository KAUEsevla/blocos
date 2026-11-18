# Contrato: núcleo do Carregar (`src/projeto/formato.js`, `src/projeto/carregar.js`)

Núcleo **puro** e medido na cobertura (`src/projeto/**`): sem Blockly, sem DOM, sem rede.
Decisões em [research.md](../research.md), R-02 a R-06 e R-09.

## `src/projeto/formato.js` (acréscimos)

A leitura fica ao lado da escrita da 011 (Premissas).

```js
export const TAMANHO_MAXIMO_ARQUIVO = 1_048_576; // 1 MB

// Leitura estrutural do texto do arquivo (research R-04). Não olha o conteúdo dos blocos.
export function lerArquivo(texto)
  → { ok: true, projeto: { formato, versao, nome, variaveis, blocos } }
  | { ok: false, motivo, detalhe? }
```

Regras:

- Tamanho medido em bytes UTF-8 (`new TextEncoder().encode(texto).length`).
- `projeto` é uma cópia nova: `variaveis` só com `{ id, nome, tipo }`; `blocos` sem `variables`.
- `nome` volta **exatamente** como está no arquivo (sem `trim`, sem saneamento).
- Nunca lança: qualquer entrada (inclusive `undefined`) vira `ok: false`.
- `lerArquivo(textoArquivo(p))` devolve `ok: true` com `assinaturaProjeto(projeto) ===
  assinaturaProjeto(p)` para todo projeto `p` que o editor monta (ida e volta da 011).

Detalhes de `dados-invalidos` desta etapa:

| Situação | `detalhe` |
| --- | --- |
| `versao` inválida | a versão do formato é inválida |
| `nome` não é texto | o nome do programa é inválido |
| `variaveis` não é lista, ou item malformado | a lista de variáveis é inválida |
| `tipo` fora de `TIPOS_VARIAVEL` | a variável "{nome}" tem o tipo "{tipo}", que não existe |
| `id` de variável repetido | há duas variáveis com a mesma identificação |
| `validarNomeVariavel` recusa | o nome da variável "{nome}" é inválido |
| `blocos` malformado | os blocos do projeto estão corrompidos |

## `src/projeto/carregar.js` (novo)

```js
import { lerArquivo } from './formato.js';
import { registroPadrao } from '../blocos/registro.js';

// Regras de blocos do research R-05. tipos: idVariavel → tipo, das variaveis do projeto.
export function validarBlocos(projeto, registro = registroPadrao)
  → { ok: true } | { ok: false, motivo: 'dados-invalidos', detalhe }

// lerArquivo + validarBlocos; anexa a mensagem de tela.
export function prepararCarregamento(texto, registro = registroPadrao)
  → { ok: true, projeto } | { ok: false, motivo, detalhe?, mensagem }

// Motivo → frase em pt-BR (tabela abaixo).
export function mensagemRecusa({ motivo, detalhe })  → string

// Erro lançado pelo Blockly no ensaio → { ok: false, erro: 'encaixe' | 'desconhecido' }.
// excecoes: { BadConnectionCheck, MissingConnection } (classes do Blockly, passadas por
// quem tem o Blockly; comparação por instanceof, research R-06).
export function classificarErroCarga(erro, excecoes)
  → { ok: false, erro: 'encaixe' | 'desconhecido' }

// Resultado do ensaio recusado → recusa com mensagem.
export function recusaDoEnsaio({ erro })
  → { ok: false, motivo: 'dados-invalidos', detalhe, mensagem }
```

### Mensagens (`mensagemRecusa`)

| `motivo` | Texto exato |
| --- | --- |
| `nao-e-projeto` | `Este arquivo não é um projeto do meuPiá Blocos.` |
| `versao-nova` | `Este projeto foi salvo numa versão mais nova do meuPiá Blocos.` |
| `grande-demais` | `Este arquivo é grande demais para ser um projeto do meuPiá Blocos (o limite é 1 MB).` |
| `dados-invalidos` | `` `Este projeto tem dados inválidos e não foi carregado: ${detalhe}.` `` |

### Detalhes de `validarBlocos`

A primeira regra violada, na ordem de visita (topos na ordem do array; em cada bloco:
campos, `inputs` na ordem das chaves, `next`), decide o detalhe:

| Situação | `detalhe` |
| --- | --- |
| `type` não registrado | o bloco "{type}" não existe no meuPiá Blocos |
| `id` ausente ou repetido | há blocos sem identificação ou com a mesma identificação |
| nenhum `programa` | falta o bloco programa |
| mais de um `programa`, `programa` encaixado ou com `id` diferente de `"programa"` | o bloco programa está duplicado ou fora do lugar |
| topo sem `x`/`y` numéricos | a posição de um bloco está faltando |
| chave de `inputs` que o bloco não tem | o bloco "{type}" tem um encaixe que não existe |
| filho sem a conexão que o encaixe pede (valor ↔ saída; comandos/`next` ↔ anterior) | um bloco está encaixado num lugar onde não cabe |
| `field_dropdown` fora das opções; `NUM` com `normalizarNumero(NUM) === null` (número inválido; `"007"` e `"3,5"` são aceitos) | um campo do bloco "{type}" tem um valor inválido |
| `VAR` com `id` fora de `variaveis` | um bloco usa uma variável que não está no projeto |
| escreva com `valores` fora de 1..10 | o bloco escreva tem uma quantidade de valores inválida |
| se com `extraState` diferente de ausente, `{ senao: true }` ou `{ senao: false }` | o bloco se tem dados inválidos |
| `encaixesIncompativeis` não vazio | um(a) {encaixado} está encaixado onde só cabe {aceito} — p.ex. "um valor lógico está encaixado onde só cabe número" |

Nomes dos checks: `Numero` → "número", `Texto` → "texto", `Logico` → "valor lógico"; lista
com mais de um → "número ou texto". O encaixado usa o check da saída do filho; bloco
`variavel` usa o tipo da variável (006, `checkEfetivo`).

Aceitos (não são erro): encaixe vazio; `VAR` ausente ou `null`; se sem `extraState`; blocos
soltos de qualquer tipo exceto `programa`.

### Detalhes do ensaio (`recusaDoEnsaio`)

| `erro` | `detalhe` |
| --- | --- |
| `encaixe` | um bloco está encaixado num lugar onde não cabe |
| `desconhecido` | o editor não conseguiu montar os blocos |

## O que os testes DEVEM conferir

| Caso | Esperado |
| --- | --- |
| cada linha de "Detalhes" acima e do `lerArquivo` | `ok: false` com o motivo e o detalhe exatos |
| arquivo de cada caso de aceitação passado por `textoArquivo` | `ok: true`, assinatura igual |
| se sem `extraState` | aceito; `temSenao` falso |
| nome `"  Média \"final\"  "` | volta idêntico |
| texto de 1 048 577 bytes | `grande-demais`, sem `JSON.parse` |
| `classificarErroCarga(new BadConnectionCheck(...))` | `erro: 'encaixe'` |
| `classificarErroCarga(new Error())` | `erro: 'desconhecido'` |
| `mensagemRecusa` | nenhuma mensagem tem texto em inglês nem stack trace |
| projeto de 100 blocos | `prepararCarregamento` em < 2 s (SC-003, com folga) |
