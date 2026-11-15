# Modelo de dados: Blocos de operadores e valores

Spec: [spec.md](spec.md). Decisões: [research.md](research.md). Contratos:
[blocos-operadores.md](contracts/blocos-operadores.md),
[tipos-encaixe.md](contracts/tipos-encaixe.md),
[editor-operadores.md](contracts/editor-operadores.md).

Todos os blocos abaixo têm `categoria: 'valor'` no registro e devolvem
`{ codigo, precedencia }`. Encaixe vazio = `???` + aviso "Falta <parte> do bloco <rótulo>"
(regra da 008). Nenhum tem estado extra.

## Tipo de valor

| Tipo | `check` | De onde vem |
| --- | --- | --- |
| Número | `Numero` | `numero`, `negativo`, `aritmetico`, variável `inteiro` ou `real` |
| Texto | `Texto` | `texto`, `aritmetico` (o `+` concatena), variável `cadeia` |
| Lógico | `Logico` | `logico`, `relacional`, `e_ou`, `nao`, variável `logico` |
| Qualquer | `null` | variável sem escolher; encaixes que aceitam tudo |

Regras: compatível se um dos lados é `null` ou se há tipo em comum (R-08). O `check` não é
serializado e não entra no gerador.

## Negativo (`negativo`)

| Campo / encaixe | Tipo | Regra |
| --- | --- | --- |
| `X` (encaixe) | aceita `Numero` | pede `PRIMARIO`: `-x`, `-3`, `-(a + b)`, `-(-x)` |
| saída | `Numero` | precedência `UNARIO` (70) |

Aviso: "Falta o valor do bloco negativo". Variantes: `padrão`.

## Comparação (`relacional`)

| Campo / encaixe | Tipo | Regra |
| --- | --- | --- |
| `A`, `B` (encaixes) | qualquer | pedem `RELACIONAL + 1` (41): comparação dentro de comparação vai entre parênteses |
| `OP` (menu) | `=`, `<>`, `<`, `>`, `<=`, `>=` | rótulos `=`, `≠`, `<`, `>`, `≤`, `≥`; inválido → `???` + aviso |
| saída | `Logico` | precedência `RELACIONAL` (40) |

Avisos: "Falta o primeiro valor do bloco comparação", "Falta o segundo valor do bloco
comparação", "Escolha a comparação do bloco comparação". Variantes: uma por `OP`.

## E / ou (`e_ou`)

| Campo / encaixe | Tipo | Regra |
| --- | --- | --- |
| `A` | aceita `Logico` | pede o nível do operador |
| `B` | aceita `Logico` | pede nível + 1 |
| `OP` (menu) | `e`, `ou` | `E` = 20, `OU` = 10; inválido → `???` + "Escolha e ou ou no bloco e/ou" |
| saída | `Logico` | precedência do operador |

Avisos: "Falta o primeiro valor do bloco e/ou", "Falta o segundo valor do bloco e/ou".
Variantes: `e`, `ou`.

## Não (`nao`)

| Campo / encaixe | Tipo | Regra |
| --- | --- | --- |
| `X` | aceita `Logico` | pede `PRIMARIO`: `nao ok`, `nao (x > 10)`, `nao (nao ok)` |
| saída | `Logico` | precedência `NAO` (30) |

Aviso: "Falta o valor do bloco não". Variantes: `padrão`.

## Valor fixo lógico (`logico`)

| Campo | Valores | Regra |
| --- | --- | --- |
| `VALOR` (menu) | `verdadeiro`, `falso` | gera o valor em minúsculas, `PRIMARIO`; inválido → `???` + "Escolha verdadeiro ou falso no bloco lógico" |
| saída | `Logico` | — |

Variantes: `verdadeiro`, `falso`.

## Blocos da 003 (só ganham `check`)

| Bloco | Saída | Encaixes | O que não muda |
| --- | --- | --- | --- |
| `numero` | `Numero` | — | `type`, campo `NUM`, `normalizarNumero`, variantes `inteiro`/`real` |
| `texto` | `Texto` | — | `type`, campo `TEXTO`, `gerarTexto`, variantes |
| `aritmetico` | `Numero`, `Texto` | `A`, `B`: `Numero`, `Texto` | `type`, `A`/`OP`/`B`, opções do menu, variantes `+ - * / %`, precedências |

## Blocos de variável da 002 (tipo pela variável)

| Bloco | `tipoPelaVariavel` | Efeito |
| --- | --- | --- |
| `variavel` | `'saida'` | saída = tipo da variável do campo `VAR` |
| `variavel_recebe` | `'VALOR'` | encaixe `VALOR` = tipo da variável do campo `VAR` |

| Tipo da variável | `check` |
| --- | --- |
| `inteiro`, `real` | `Numero` |
| `cadeia` | `Texto` |
| `logico` | `Logico` |
| sem variável (`VAR: null`) ou variável desconhecida | `null` |

## Encaixe incompatível

Par `{ pai, encaixe, filho }` em que o `check` efetivo do encaixe do pai e o da saída do
filho não são compatíveis. Encontrado por `encaixesIncompativeis` (puro), que percorre o
estado serializado (todos os blocos de topo, `inputs` e `next`) com o mapa
`idVariavel → tipo`.

Transições (interface, R-10):

```text
mudar o tipo da variável v para T
  → pares = encaixesIncompativeis(estado, registro, tipos com v = T) que envolvem v
  → desencaixar o filho de cada par (fica solto ao lado)
  → mudar o tipo
  (um grupo de eventos: um Ctrl+Z volta o tipo e reencaixa)

trocar a variável do campo VAR de um bloco para w
  → mesma verificação para esse bloco, como filho e como pai
  → desencaixar → trocar
```

## Expressão (precedência)

```text
OU 10 < E 20 < NAO 30 < RELACIONAL 40 < ADITIVO 50 < MULTIPLICATIVO 60 < UNARIO 70 < PRIMARIO 100
```

Regra do `ctx.valor` (003, inalterada): filho com precedência menor que a pedida volta entre
parênteses. Tabela completa no [research](research.md), R-03.

## Caixa de blocos

```text
Variáveis (dinâmica) · Entrada e saída (dinâmica)
Valores:      numero · texto · logico (verdadeiro)
Contas:       aritmetico (+) · negativo
Comparações:  relacional (=)
Lógica:       e_ou (e) · e_ou (ou) · nao
```
