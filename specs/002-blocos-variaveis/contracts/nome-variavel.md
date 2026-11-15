# Contrato: regra do nome de variável

Módulo `src/projeto/nome-variavel.js`. Núcleo puro: não importa `blockly`, não toca o
DOM nem estado global. Usado pela interface da 002 (criar e renomear) e pela 012
(validar arquivo carregado).

## API

```js
validarNomeVariavel(nome: unknown, variaveis: Variavel[] = [], { ignorarId } = {})
  → { valido: boolean, nome: string, motivo: MotivoRecusa | null, mensagem: string | null }

NOMES_RESERVADOS: ReadonlySet<string>      // em minúsculas
PALAVRAS_PORTUGOL, NATIVOS_CORE, NOMES_RUNTIME, PALAVRAS_PYTHON, NATIVOS_PYTHON: readonly string[]
TAMANHO_MAXIMO_NOME === 30
```

`Variavel` e `MotivoRecusa`: ver [data-model.md](../data-model.md).

## Regras

1. `nome` que não é `string` é tratado como `""` (motivo `vazio`). Nunca lança.
2. Tira os espaços das pontas; o resultado vai em `nome`, válido ou não.
3. Verifica na ordem da tabela de research R-11 e para na primeira regra quebrada.
4. Formato válido = `/^[A-Za-z][A-Za-z0-9_]{0,29}$/`.
5. Reservado: `NOMES_RESERVADOS.has(nome.toLowerCase())`.
6. Duplicado: existe `v` em `variaveis` com `v.id !== ignorarId` e
   `v.nome.toLowerCase() === nome.toLowerCase()`. A mensagem usa `v.nome` como está
   gravado.
7. Não altera `variaveis`.

## Exemplos normativos

| Entrada | `variaveis` | Resultado |
| --- | --- | --- |
| `"idade"` | `[]` | `{ valido: true, nome: "idade", motivo: null, mensagem: null }` |
| `"  idade "` | `[]` | válido, `nome: "idade"` |
| `"2lugar"` | `[]` | `inicio`, "O nome precisa começar com uma letra." |
| `"se"` | `[]` | `reservado`, "Este nome é reservado." |
| `"minha idade"` | `[]` | `espaco` |
| `"Print"` / `"MAIN"` / `"None"` | `[]` | `reservado` |
| `"Idade"` | `[{ id: "v1", nome: "idade", tipo: "inteiro" }]` | `duplicado`, "Já existe a variável idade." |
| `"Idade"`, `{ ignorarId: "v1" }` | a mesma | válido (renomear só a caixa) |
| `"MeuPrograma"` | `[]` | válido (igual ao nome do programa é permitido) |
| `"entrada"` / `"senha"` | `[]` | válido (contém `e`/`se`, mas não é a palavra) |
| 30 letras | `[]` | válido |
| 31 letras | `[]` | `longo` |

## Garantias testadas

| Garantia | Teste |
| --- | --- |
| Cada motivo e mensagem | unidade: um exemplo por linha de R-11, mais os limites 1 e 30/31 caracteres. |
| Ordem das regras | unidade: entradas que quebram duas regras (`"2 lugar"` → `espaco`; `"ação 2"` → `espaco`; `"2ação"` → `acento`). |
| Todos os reservados, sem diferenciar maiúsculas | unidade: para cada nome de cada grupo, o nome, em MAIÚSCULAS e com a primeira letra maiúscula são recusados com `reservado` (os que não começam com letra, nenhum hoje, seriam recusados antes). |
| Lista completa em relação ao Python real | aceitação (`nomes-reservados.test.js`): no Pyodide, todo nome de `keyword.kwlist` e de `dir(builtins)` que casa com `/^[A-Za-z]/` está em `NOMES_RESERVADOS`. |
| Nomes aceitos rodam no Core (SC-001) | aceitação: caso `variaveis-nomes-limite.json`. |
| Pureza | unidade: `variaveis` congelado com `Object.freeze` não lança; o resultado não depende de chamadas anteriores. |
