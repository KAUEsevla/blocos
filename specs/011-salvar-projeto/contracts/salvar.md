# Contrato: núcleo do Salvar (`src/projeto/formato.js`, `src/projeto/salvar.js`)

Núcleo puro, **dentro da cobertura** (`src/projeto/**`). Não importa Blockly nem toca o
DOM. Decisões em [research.md](../research.md), R-02 a R-05 e R-07.

## `src/projeto/formato.js` (existente; acréscimos)

Continua exportando `FORMATO`, `VERSAO_FORMATO`, `TIPOS_VARIAVEL` e `projetoVazio()` sem
mudança. Acrescenta:

### `montarArquivo(projeto) → ArquivoProjeto`

- Devolve um objeto **novo** com as chaves, nesta ordem: `formato: FORMATO`,
  `versao: VERSAO_FORMATO`, `nome`, `variaveis`, `blocos`.
- `formato` e `versao` vêm sempre das constantes, mesmo que o projeto traga outros valores.
- Ausentes: `nome` → `''`, `variaveis` → `[]`, `blocos` → `{}`.
- `variaveis`: cada item vira `{ id, nome, tipo }` (só esses campos), na ordem recebida.
- `blocos`: cópia profunda **sem** a chave `variables` (008, "Origem das variáveis").
- Não altera a entrada; o resultado não compartilha objetos com ela.

### `textoArquivo(projeto) → string`

- `JSON.stringify(montarArquivo(projeto), null, 2) + '\n'`.
- Determinística; caracteres não ASCII ficam legíveis (sem `\uXXXX`).

## `src/projeto/salvar.js` (novo)

### `nomeArquivo(nome) → string`

| Entrada | Saída |
| --- | --- |
| `"Media"` | `Media.json` |
| `"  Media  "` | `Media.json` |
| `"Média final"` | `Média final.json` |
| `"a/b\\c:d*e?f\"g<h>i|j"` | `a_b_c_d_e_f_g_h_i_j.json` |
| texto com `\t` ou outro controle | cada controle vira `_` |
| `""`, `"   "`, `undefined`, `null` | `MeuPrograma.json` |

### `prepararSalvamento(projeto) → { nomeArquivo, texto, referencia }`

- `nomeArquivo = nomeArquivo(projeto.nome)`
- `texto = textoArquivo(projeto)`
- `referencia = assinaturaProjeto(projeto)` (de `alteracoes.js`, sem mudança)
- Garante `haAlteracoes(projeto, referencia) === false` e
  `assinaturaProjeto(JSON.parse(texto)) === referencia` (o arquivo lido de volta não conta
  como alteração; a 012 depende disso).
- Não altera `projeto`. Não faz rede.

## Casos que os testes DEVEM cobrir

| Caso | Esperado |
| --- | --- |
| `montarArquivo(projetoVazio())` | chaves `formato, versao, nome, variaveis, blocos` nessa ordem; valores do projeto vazio |
| Projeto com `formato`/`versao` diferentes | arquivo com `meupia-blocos` e `1` |
| Projeto sem `nome`/`variaveis`/`blocos` | `''`, `[]`, `{}` |
| `blocos.variables` presente | ausente no arquivo |
| Variável com campo extra | só `id`, `nome`, `tipo` |
| Mudar o resultado de `montarArquivo` | projeto original intacto |
| `escreva` com `extraState: { valores: 3 }` e `se` com `{ senao: true }` | preservados no texto |
| `textoArquivo` | 2 espaços, termina em `\n`, `"Média"` aparece literal, chamadas repetidas iguais |
| Tabela de `nomeArquivo` | conforme acima |
| `prepararSalvamento(p)` | três campos; `haAlteracoes(p, referencia) === false`; `assinaturaProjeto(JSON.parse(texto)) === referencia`; `JSON` de `p` antes = depois |
| Projeto com 100 blocos | `prepararSalvamento` em menos de 1 s (SC-002) |
| Código de `salvar.js` e `src/ui/download.js` | sem `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket` (FR-004) |
