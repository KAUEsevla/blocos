# Modelo de dados (Fase 1): Blocos de decisão (se/senão)

Spec: [spec.md](spec.md). Pesquisa: [research.md](research.md).

O formato do projeto (v1) não muda de versão. O `se` é um nó comum de
`projeto.blocos.blocks`, como os blocos da 003 e da 006.

## Nó JSON do `se`

```json
{
  "type": "se",
  "id": "s1",
  "extraState": { "senao": true },
  "inputs": {
    "CONDICAO": { "block": { "type": "relacional", "…": "…" } },
    "ENTAO":    { "block": { "type": "escreva", "…": "…" } },
    "SENAO":    { "block": { "type": "escreva", "…": "…" } }
  },
  "next": { "block": { "…": "…" } }
}
```

| Campo | Tipo | Regra |
| --- | --- | --- |
| `type` | `'se'` | Fixo. |
| `extraState` | `{ senao: true }` ou ausente | `senao === true` liga o senão. Ausente, `false` ou qualquer outro valor = sem senão. O mutador salva `{ senao: true }` com o senão e nada sem ele. |
| `inputs.CONDICAO.block` | nó de valor | Saída `Logico` ou sem tipo (`check: ['Logico']`, R-05): `relacional`, `e_ou`, `nao`, `logico` ou `variavel` lógica. Ausente = condição vazia (`???` + aviso). |
| `inputs.ENTAO.block` | nó de comando (primeiro da cadeia) | Opcional. Ausente = área vazia (permitida). |
| `inputs.SENAO.block` | nó de comando | Só é lido com `senao === true`. Opcional. |
| `next` | nó de comando | A sequência continua depois do `fim_se`. |

## Variantes (meta-aceitação)

| Variante | `presente(bloco)` |
| --- | --- |
| `sem senão` | `bloco.extraState?.senao !== true` |
| `com senão` | `bloco.extraState?.senao === true` |

## Aviso

| Situação | `encaixe` | Mensagem |
| --- | --- | --- |
| Condição vazia | `CONDICAO` | `Falta a condição do bloco se` |

O aviso segue o formato da 008 (`blocoId`, `tipoBloco`, `encaixe`, `mensagem`) e bloqueia
Executar (009).

## Estados do senão (no editor)

```text
sem senão ──(+)──► com senão (área vazia)
com senão ──(−, área vazia)──► sem senão
com senão ──(−, área com N blocos)──► pergunta ──(Tirar o senão)──► sem senão, N blocos apagados
                                               └─(Cancelar / Esc)──► com senão, nada muda
```

Cada mudança é um grupo de eventos: um Ctrl+Z volta ao estado anterior, com os blocos
apagados.

## Confirmação

| Campo | Valor |
| --- | --- |
| Título | `Tirar o senão?` |
| Mensagem | `mensagemTirarSenao(n)`: n = 1 → `Tirar o senão apaga 1 bloco que está dentro dele.`; n > 1 → `Tirar o senão apaga n blocos que estão dentro dele.` |
| Botões | `Tirar o senão` / `Cancelar` |

`n` conta todos os blocos dentro da área (comandos e os blocos de valor encaixados neles,
inclusive os de `se` aninhados), como o Blockly apaga.
