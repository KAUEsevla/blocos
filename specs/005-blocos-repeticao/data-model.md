# Modelo de dados (Fase 1): Blocos de repetição (enquanto/para)

Spec: [spec.md](spec.md). Pesquisa: [research.md](research.md).

O formato do projeto (v1) não muda de versão. `enquanto` e `para` são nós comuns de
`projeto.blocos.blocks`, sem `extraState`.

## Nó JSON do `enquanto`

```json
{
  "type": "enquanto",
  "id": "e1",
  "inputs": {
    "CONDICAO": { "block": { "type": "relacional", "…": "…" } },
    "FACA":     { "block": { "type": "escreva", "…": "…" } }
  },
  "next": { "block": { "…": "…" } }
}
```

| Campo | Tipo | Regra |
| --- | --- | --- |
| `type` | `'enquanto'` | Fixo. |
| `inputs.CONDICAO.block` | nó de valor | Saída `Logico` ou sem tipo (`check: ['Logico']`, R-07). Ausente = `???` + aviso. |
| `inputs.FACA.block` | nó de comando (primeiro da cadeia) | Opcional. Ausente = corpo vazio (permitido). |
| `next` | nó de comando | A sequência continua depois do `fim_enquanto`. |

## Nó JSON do `para`

```json
{
  "type": "para",
  "id": "p1",
  "fields": { "VAR": { "id": "v-i" } },
  "inputs": {
    "DE":    { "block": { "type": "numero", "fields": { "NUM": "5" } } },
    "ATE":   { "block": { "type": "numero", "fields": { "NUM": "1" } } },
    "PASSO": { "block": { "type": "negativo", "inputs": { "X": { "block": { "type": "numero", "fields": { "NUM": "1" } } } } } },
    "FACA":  { "block": { "type": "escreva", "…": "…" } }
  }
}
```

| Campo | Tipo | Regra |
| --- | --- | --- |
| `type` | `'para'` | Fixo. |
| `fields.VAR` | `{ id }` | Variável de `projeto.variaveis` do tipo `inteiro` (FR-003). Ausente ou inexistente = `???` + aviso; de outro tipo = aviso (R-06). |
| `inputs.DE.block`, `inputs.ATE.block` | nó de valor | `check: ['Numero']`. Ausente = `???` + aviso. |
| `inputs.PASSO.block` | nó de valor | `check: ['Numero']`. **Opcional**: ausente = sem `passo` no Portugol (FR-005). |
| `inputs.FACA.block` | nó de comando | Opcional. Ausente = corpo vazio (permitido). |
| `next` | nó de comando | A sequência continua depois do `fim_para`. |

## Valor fixo

`valorFixo(no)` (R-05), puro:

| Nó | Resultado |
| --- | --- |
| `numero` com `NUM` válido | `normalizarNumero(NUM)` (ex.: `'0'`, `'1.5'`) |
| `negativo` com um `numero` válido em `X` | `'-' + normalizarNumero(NUM)` |
| qualquer outro, ausente ou `NUM` inválido | `null` |

## Variantes (meta-aceitação)

| Bloco | Variante | `presente(bloco)` |
| --- | --- | --- |
| `enquanto` | `padrão` (implícita) | sempre |
| `para` | `sem passo` | `!bloco.inputs?.PASSO?.block` |
| `para` | `com passo` | `Boolean(bloco.inputs?.PASSO?.block)` |

## Avisos

| Situação | `encaixe` | Mensagem |
| --- | --- | --- |
| condição vazia | `CONDICAO` | `Falta a condição do bloco enquanto` |
| variável vazia ou inexistente | `VAR` | `Falta a variável de controle do bloco para` |
| variável não inteira | `VAR` | `A variável de controle do bloco para precisa ser do tipo inteiro` |
| de vazio | `DE` | `Falta o valor inicial (de) do bloco para` |
| até vazio | `ATE` | `Falta o valor final (até) do bloco para` |
| passo fixo zero | `PASSO` | `O passo do bloco para não pode ser zero: o laço nunca terminaria` |
| número fixo com casas decimais | `DE`, `ATE` ou `PASSO` | `O bloco para só conta com números inteiros: tire as casas decimais` |

Um passo fixo que vale zero mostra **só** o aviso de zero, mesmo escrito com casas decimais
(`0,0` → `0.0`): o de casas decimais não se soma a ele.

Todos bloqueiam Executar (009). Os avisos saem na ordem do texto: variável, de, até, passo.

## Estados

Os dois blocos não têm estado próprio. A única transição relevante é externa: a variável de
controle mudar de tipo (002) liga ou desliga o aviso "precisa ser do tipo inteiro" na
próxima geração (007).
