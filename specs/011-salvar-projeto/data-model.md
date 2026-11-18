# Modelo de dados (Fase 1): Salvar projeto em JSON

A 011 **não cria formato novo**: o arquivo é o Projeto v1 da 008
([data-model da 008](../008-portugol-valido/data-model.md)), com as constantes de
`src/projeto/formato.js`. Esta spec fixa como ele é escrito e o estado de "salvo".

## Arquivo de projeto (v1)

Chaves **nesta ordem** no texto (research R-04):

| Campo | Tipo | Origem no Salvar | Regras |
| --- | --- | --- | --- |
| `formato` | `"meupia-blocos"` | `FORMATO` | Constante. Identifica o arquivo (FR-002). |
| `versao` | `1` | `VERSAO_FORMATO` | Começa em 1. Muda só com mudança incompatível do formato. |
| `nome` | `string` | `projeto.nome` (valor bruto do campo) | Pode ser vazio ou ter qualquer caractere; quem gera o Portugol saneia. |
| `variaveis` | `Variavel[]` | `variaveisDoWorkspace(ws)` | Ordem do mapa do Blockly: tipos na ordem do primeiro de cada um, ordem de criação dentro do tipo (002 R-04). Pode ser vazia. |
| `blocos` | `object` | `serializarBlocos(ws)` | Serialização do Blockly **sem** `variables`. Pode ser `{}`. |

`montarArquivo` usa defaults neutros para campos ausentes (`nome: ''`, `variaveis: []`,
`blocos: {}`), os mesmos da assinatura (001, contracts/alteracoes.md).

### Variavel

`{ id, nome, tipo }`, `tipo` ∈ `TIPOS_VARIAVEL` (`inteiro`, `real`, `cadeia`, `logico`).
Sem outros campos.

### Blocos: o que cada spec deixa no nó

| Spec | Bloco | Estado no nó JSON |
| --- | --- | --- |
| 001 | `programa` | `id: "programa"`, `x`, `y`, `deletable: false`; `inputs.COMANDOS` |
| 002 | `variavel`, `variavel_recebe` | `fields.VAR: { id }` |
| 003 | `leia` | `fields.VAR: { id }` |
| 003 | `escreva` | `extraState: { valores: n }` (1..10), `inputs.VALOR0`…`VALOR{n-1}` |
| 004 | `se` | senão ligado: `extraState: { senao: true }` e `inputs.SENAO`; desligado: **sem** `extraState` |
| 005 | `enquanto`, `para` | `inputs`/`fields` comuns, sem `extraState` |
| 006 | operadores, valores | `fields` (operador, número, texto, lógico) e `inputs` |
| todas | qualquer topo | `x`, `y`; topos diferentes de `programa` são blocos soltos e ficam no array |
| todas | bloco encaixado (em `inputs` ou `next`) | **sem** `x`/`y`: a posição vem do bloco onde está encaixado |
| todas | encaixe vazio | chave ausente em `inputs` ou sem `block` (bloco incompleto preservado) |

**Posições**: só os blocos de topo (os itens de `blocos.blocks.blocks[]`) guardam posição.
Os encaixados não têm `x`/`y`; ao carregar, o Blockly os desenha presos ao bloco pai. É isso
que o FR-002 chama de "blocos com suas posições".

A tabela é conferida pelo teste de ida e volta com **todos** os tipos de
`registroPadrao.tiposRegistrados()` (research R-09): um tipo novo registrado sem entrar no
teste faz o teste falhar.

### Exemplo (resumido)

```json
{
  "formato": "meupia-blocos",
  "versao": 1,
  "nome": "Media",
  "variaveis": [
    { "id": "v1", "nome": "nota", "tipo": "real" }
  ],
  "blocos": {
    "blocks": {
      "languageVersion": 0,
      "blocks": [
        { "type": "programa", "id": "programa", "x": 24, "y": 24, "deletable": false,
          "inputs": { "COMANDOS": { "block": { "type": "leia", "id": "b1",
            "fields": { "VAR": { "id": "v1" } } } } } }
      ]
    }
  }
}
```

## Salvamento preparado

Saída de `prepararSalvamento(projeto)` ([contrato](contracts/salvar.md)):

| Campo | Tipo | Regras |
| --- | --- | --- |
| `nomeArquivo` | `string` | `nomeArquivo(projeto.nome)`: termina em `.json`, sem `/ \ : * ? " < > |` nem controle; nunca só `.json`. |
| `texto` | `string` | `textoArquivo(projeto)`. |
| `referencia` | `string` | `assinaturaProjeto(projeto)`. |

## Referência de "salvo" (estado em `main.js`)

Mesma variável `referencia` da 001. Esta spec preenche a linha "Projeto salvo":

| Momento | Quem marca | Valor |
| --- | --- | --- |
| Página aberta, Novo | 001 | assinatura do projeto novo depois de carregado |
| **Salvar** | **011** | `prepararSalvamento(p).referencia`, com `p` o objeto gravado |
| Carregar | 012 | `assinaturaProjeto(projetoAtual())` lida depois do `recarregarBlocos` ([data-model da 012](../012-carregar-projeto/data-model.md)) |

**Derivado**: `alterado = haAlteracoes(projetoAtual(), referencia)`. Lido no Novo (001),
no indicador e no `beforeunload` (011).

## Transições

```text
                 qualquer evento não-UI / nome / fim do arraste
   sem alterações ─────────────────────────────────────────────▶ com alterações
        ▲   ▲                                                       │   │
        │   └──────────── desfazer até o estado salvo ──────────────┘   │
        └───────────────────────── Salvar (ou Novo) ────────────────────┘

com alterações: indicador visível; Novo pede confirmação; fechar/recarregar pede confirmação
sem alterações: indicador oculto; Novo não pergunta; fechar não pergunta
```

Salvar não muda o projeto aberto (FR-005): workspace, pilha de desfazer, nome e Saída
ficam como estavam; só `referencia` e o indicador mudam.
