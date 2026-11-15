# Modelo de dados: Blocos de entrada e saída (leia/escreva)

Complementa o [data-model da 008](../008-portugol-valido/data-model.md) (Projeto,
Variavel, Bloco) e o [da 002](../002-blocos-variaveis/data-model.md) (Variável, campo
`VAR`). **O formato do arquivo não muda** (continua `versao: 1`): os blocos novos são
nós da serialização do Blockly que o formato já guarda em `blocos`.

## Comando escreva (`escreva`)

Spec: entidade "Comando escreva" (lista ordenada de 1 a 10 valores).

```json
{
  "type": "escreva",
  "id": "…",
  "extraState": { "valores": 2 },
  "inputs": {
    "VALOR1": { "block": { "type": "texto", "fields": { "TEXTO": "Idade: " } } },
    "VALOR2": { "block": { "type": "variavel", "fields": { "VAR": { "id": "v-idade" } } } }
  }
}
```

| Campo | Regras |
| --- | --- |
| `extraState.valores` | Inteiro de 1 a 10 (`MAX_VALORES`). Ausente, não inteiro ou < 1 → 1; > 10 → 10 (`quantidadeValores`). Arquivo antigo ou editado à mão nunca quebra a geração. |
| `inputs.VALORk` | `k` de 1 a `valores`. Encaixe ausente = vazio = `???` + aviso. Encaixes com `k` > `valores` são ignorados pelo gerador. |

**Geração**: `escreva(v1, v2, …, vn)`, separados por `, `, na ordem de `k`. Aviso de
encaixe vazio: "Falta o valor do bloco escreva" (n = 1) ou "Falta o valor k do bloco
escreva" (n > 1).

**Execução** (Core, R-02): os valores saem colados, sem separador, e cada `escreva`
termina numa linha própria. Lógicos saem como `verdadeiro`/`falso`.

**Variantes**: "um valor" (`valores` = 1, ou ausente) e "vários valores" (> 1).

## Comando leia (`leia`)

Spec: entidade "Comando leia" (referência a uma variável do projeto).

```json
{ "type": "leia", "id": "…", "fields": { "VAR": { "id": "v-nome" } } }
```

| Campo | Regras |
| --- | --- |
| `fields.VAR` | Mesmo campo `campo_variavel` da 002: `{ id }` de uma variável de `projeto.variaveis`, ou `null` sem variável. Qualquer dos quatro tipos. |

**Geração**: `leia(nome)`. Sem variável (ou id que não existe): `leia(???)` + "Falta a
variável do bloco leia".

**Execução** (Core, R-02): uma linha da entrada por `leia`. `inteiro` e `real` exigem
número (senão erro de execução "O valor digitado não é um número", 008); `cadeia`
guarda o texto como veio; `logico` é verdadeiro só se o texto, sem espaços nas pontas e
sem diferenciar maiúsculas, for `verdadeiro`.

**Relação com variáveis**: renomear a variável muda o `leia` (o campo guarda o id);
apagar a variável apaga o `leia`, que conta como uso na confirmação (002, FR-008).

## Valor fixo de número (`numero`) — RF-06, antecipado da 006

```json
{ "type": "numero", "fields": { "NUM": "3.5" } }
```

| Campo | Regras |
| --- | --- |
| `fields.NUM` | Texto já normalizado por `normalizarNumero`: só dígitos, com no máximo um `.` seguido de dígitos; sem zeros à esquerda além de um; sem sinal. Valor inicial `"0"`. |

**Normalização** (`normalizarNumero(texto) → string | null`):

| Digitado | Guardado |
| --- | --- |
| `3`, ` 3 ` | `3` |
| `3,5`, `3.5` | `3.5` |
| `007` | `7` |
| `00,5` | `0.5` |
| `0` | `0` |
| `12a`, `.5`, `5.`, `1.000,5`, `-3`, `1e3`, vazio | `null` (recusado; o campo volta ao valor anterior) |

**Geração**: `normalizarNumero(NUM)`, precedência `PRIMARIO`. O gerador normaliza de
novo mesmo que o campo já guarde o valor normalizado: um arquivo editado à mão com
`"007"` gera `7` e não quebra o Core (R-07). Um `NUM` que não passa na regra gera `???` +
"O número do bloco número é inválido".

**Variantes**: "inteiro" (sem `.`) e "real" (com `.`).

## Valor fixo de texto (`texto`) — RF-06, antecipado da 006

```json
{ "type": "texto", "fields": { "TEXTO": "Olá, mundo!" } }
```

| Campo | Regras |
| --- | --- |
| `fields.TEXTO` | Qualquer texto de uma linha, inclusive vazio. Valor inicial `""`. |

**Geração** (`gerarTexto`): `\` → `\\`, depois `"` → `\"`, entre aspas duplas. Vazio →
`""`. Precedência `PRIMARIO`. Na Saída o texto aparece exatamente como digitado (R-08).

**Variantes**: "simples" e "com aspas ou barra" (contém `"` ou `\`).

## Operação aritmética (`aritmetico`) — RF-06, antecipado da 006

```json
{
  "type": "aritmetico",
  "fields": { "OP": "+" },
  "inputs": { "A": { "block": { … } }, "B": { "block": { … } } }
}
```

| `OP` | Rótulo no bloco | Portugol | Precedência |
| --- | --- | --- | --- |
| `+` | `+` | `+` | `ADITIVO` (50) |
| `-` | `−` | `-` | `ADITIVO` (50) |
| `*` | `×` | `*` | `MULTIPLICATIVO` (60) |
| `/` | `÷` | `/` | `MULTIPLICATIVO` (60) |
| `%` | `resto` | `%` | `MULTIPLICATIVO` (60) |

**Geração**: `A op B`, com `A` pedido com precedência mínima `p` e `B` com `p + 1`
(parênteses só quando a estrutura exige, R-06). Encaixe vazio: "Falta o primeiro valor
do bloco conta" / "Falta o segundo valor do bloco conta". `OP` desconhecido →
`???` + aviso.

**Variantes**: uma por operador (`+`, `-`, `*`, `/`, `%`).

**Tipos**: sem `check` nesta spec; texto com número no `+` é concatenação (regra do
Core). Os `check` são da 006.

## Expressão (precedência)

`PRECEDENCIA` passa a ter `ADITIVO: 50`, `MULTIPLICATIVO: 60` e `PRIMARIO: 100`
(escala da 008/R-02; a 006 acrescenta os demais níveis). Todo bloco de valor devolve
`{ codigo, precedencia }`; `ctx.valor(bloco, encaixe, parte, precedenciaMinima)` põe
parênteses quando `precedencia < precedenciaMinima` (contrato em
[blocos-valores-contas.md](contracts/blocos-valores-contas.md)).

## Caixa de blocos

| Categoria | Tipo | Conteúdo |
| --- | --- | --- |
| Variáveis (002) | dinâmica `VARIAVEIS` | sem mudança |
| Entrada e saída | dinâmica `ENTRADA_SAIDA` | `escreva` com `texto` “Olá, mundo!”; com variáveis, `leia` com a última da lista do mapa; sem variáveis, rótulo de orientação + botão "Criar variável…" |
| Valores | estática | `numero` (`0`), `texto` (vazio) |
| Contas | estática | `aritmetico` (`+`) |
