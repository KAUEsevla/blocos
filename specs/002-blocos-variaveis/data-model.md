# Modelo de dados: Blocos de variáveis

Complementa o [data-model da 008](../008-portugol-valido/data-model.md) (Projeto,
Variavel, Bloco). Nada no formato do arquivo muda: a 002 só passa a preencher
`variaveis` e a usar blocos novos.

## Variável

Mesma entidade `Variavel` da 008, agora com as regras da 002.

| Campo | Tipo | Regras |
| --- | --- | --- |
| `id` | `string` | Id gerado pelo Blockly ao criar. Único no projeto. Não muda ao renomear nem ao mudar o tipo. |
| `nome` | `string` | Passa em `validarNomeVariavel` (ver abaixo). Único sem diferenciar maiúsculas. |
| `tipo` | `"inteiro" \| "real" \| "cadeia" \| "logico"` | Guardado como tipo da variável do Blockly (research R-04). |

**Valor inicial** (dado pelo Core, não pelo gerador): `inteiro` → `0`, `real` →
`0.0`, `cadeia` → texto vazio, `logico` → `falso` (`code_generator.py`,
`valor_inicial`). Conferido no Core real pelo caso
[`escreva-valores-iniciais.json`](../../tests/aceitacao/casos/escreva-valores-iniciais.json)
(spec 003, pendência P-2).

**Escopo**: sempre global (FR-009).

### Ordem

`projeto.variaveis` = `ws.getVariableMap().getAllVariables()` convertido por
`variaveisDoMapa`. O gerador agrupa por tipo e preserva a ordem dentro do tipo, então a
seção `var` fica:

- grupos na ordem `inteiro`, `real`, `cadeia`, `logico`;
- dentro do grupo, na ordem de criação;
- uma variável que mudou de tipo vai para o fim do grupo novo;
- uma variável recriada pelo desfazer volta no fim do grupo dela.

### Ciclo de vida

```text
             criar (nome válido + tipo)
  (nenhuma) ─────────────────────────────▶ declarada ──┬── renomear (nome válido) ──▶ declarada (mesmo id)
                                              ▲        ├── mudar o tipo ───────────▶ declarada (mesmo id, fim do grupo novo)
                                              │        └── apagar ─┬─ sem usos ─────────────▶ (nenhuma)
                                              │                    └─ com usos ─ confirmar ─▶ (nenhuma) + usos apagados
                                              └──────────── desfazer ─────────────────────────────┘
```

Todas as transições são eventos não-UI do Blockly: entram no desfazer e disparam a
atualização do Portugol (007).

## Regra do nome

`validarNomeVariavel(nome, variaveis, opcoes)` → `ResultadoNome`. Contrato em
[contracts/nome-variavel.md](contracts/nome-variavel.md).

### ResultadoNome

| Campo | Tipo | Regras |
| --- | --- | --- |
| `valido` | `boolean` | `true` só se nenhuma regra for quebrada. |
| `nome` | `string` | O nome sem os espaços das pontas (o que deve ser gravado). |
| `motivo` | `MotivoRecusa \| null` | `null` quando válido. |
| `mensagem` | `string \| null` | Texto pt-BR da tabela de R-11; `null` quando válido. |

`MotivoRecusa`: `"vazio" | "longo" | "espaco" | "acento" | "caractere" | "inicio" |
"reservado" | "duplicado"`, na ordem em que são verificados (research R-11).

### Nomes reservados

`NOMES_RESERVADOS`: `Set` com os nomes em minúsculas, montado a partir de cinco grupos
exportados separadamente (para os testes e para revisar quando o Core mudar):

| Grupo | Origem | Fonte |
| --- | --- | --- |
| `PALAVRAS_PORTUGOL` | palavras-chave do lexer + tipos de contexto | Core 1.4.1, R-02 itens 1–2 |
| `NATIVOS_CORE` | funções e constantes nativas | Core 1.4.1, R-02 item 3 |
| `NOMES_RUNTIME` | nomes globais do código gerado | Core 1.4.1, R-02 item 4 |
| `PALAVRAS_PYTHON` | `keyword.kwlist` | Python 3.11, R-03 |
| `NATIVOS_PYTHON` | `dir(builtins)` que começam com letra | Python 3.11, R-03 |

Comparação: `NOMES_RESERVADOS.has(nome.toLowerCase())`.

## Blocos

Contrato em [contracts/blocos-variaveis.md](contracts/blocos-variaveis.md).

| `type` | Categoria | Campos / encaixes | Portugol | Avisos possíveis |
| --- | --- | --- | --- | --- |
| `variavel_recebe` | `comando` | campo `VAR` (`{ id }`), valor `VALOR` | `nome <- valor` | "Falta a variável do bloco recebe", "Falta o valor do bloco recebe" |
| `variavel` | `valor` | campo `VAR` (`{ id }`) | `nome` | "Falta a variável do bloco variável" |

Exemplo de nó serializado (o mesmo que o `save()` do Blockly produz):

```json
{
  "type": "variavel_recebe",
  "id": "b1",
  "fields": { "VAR": { "id": "v-idade" } },
  "inputs": {
    "VALOR": { "block": { "type": "variavel", "id": "b2", "fields": { "VAR": { "id": "v-anos" } } } }
  }
}
```

Variáveis: `[{ "id": "v-idade", "nome": "idade", "tipo": "inteiro" }, { "id": "v-anos", "nome": "anos", "tipo": "inteiro" }]`
→ linha `idade <- anos`.

## Caixa de blocos

| Elemento | Forma |
| --- | --- |
| `CAIXA_BLOCOS` | `{ kind: 'categoryToolbox', contents: [ { kind: 'category', name: 'Variáveis', custom: 'VARIAVEIS', colour: … } ] }`. A 003–006 acrescentam categorias. |
| `conteudoCategoriaVariaveis(variaveis)` | Lista de itens do *flyout*: `{ kind: 'button', text: 'Criar variável…', callbackKey: 'CRIAR_VARIAVEL' }`; com variáveis, `{ kind: 'block', type: 'variavel_recebe', fields: { VAR: { id } } }` da última da lista (ver o contrato, "Caixa de blocos") e um `{ kind: 'block', type: 'variavel', fields: { VAR: { id } } }` por variável, na ordem da seção `var`. |

## Confirmação de apagar

### Contagem

`contarBlocosApagados(blocos, idVariavel)` → `{ usos, total }`, sobre a serialização
JSON do workspace (todos os blocos de topo, dentro e fora do `programa`):

- `usos`: blocos com algum campo `{ id: idVariavel }`;
- `total`: `usos` mais todos os blocos encaixados neles (encaixes de valor e de
  comandos, com as cadeias `next` dentro desses encaixes), sem contar duas vezes um
  bloco que está dentro de outro uso (ex.: `a recebe [a]` → `usos: 2`, `total: 2`).
  O `next` do próprio bloco de uso **não** conta: o Blockly sobe o comando seguinte
  para o lugar dele (research R-06).

### Mensagem

`textoApagar(nome, { usos, total })` → `{ titulo, mensagem, confirmar, cancelar }` para
o `confirmar()` da 001. A mensagem informa o total real de blocos removidos (FR-008):

| Caso | `mensagem` |
| --- | --- |
| `usos = 1`, `total = 1` | "A variável idade é usada em 1 bloco. Esse bloco também será apagado." |
| `usos = n > 1`, `total = n` | "A variável idade é usada em 3 blocos. Esses blocos também serão apagados." |
| `usos = 1`, `total = t > 1` | "A variável idade é usada em 1 bloco. Ao apagar, 3 blocos serão removidos: esse bloco e os que estão encaixados nele." |
| `usos = n > 1`, `total = t > n` | "A variável idade é usada em 3 blocos. Ao apagar, 5 blocos serão removidos: esses blocos e os que estão encaixados neles." |

`titulo`: "Apagar a variável idade?"; `confirmar`: "Apagar"; `cancelar`: "Cancelar".
Com `usos === 0` não há confirmação. Pela tela esse caso não acontece: o menu de apagar
só existe num bloco que usa a variável (quickstart, nota do passo 14).
