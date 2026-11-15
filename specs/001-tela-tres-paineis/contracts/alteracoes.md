# Contrato: alterações não salvas (`src/projeto/alteracoes.js`)

Núcleo puro, **dentro da cobertura**. Não importa Blockly nem toca o DOM. Usado pela
001 (Novo) e pelas specs 011 (Salvar) e 012 (Carregar). Decisão em
[research.md](../research.md), R-05.

## `assinaturaProjeto(projeto) → string`

- Entrada: um projeto no formato v1 (`{ formato, versao, nome, variaveis, blocos }`).
- Saída: texto JSON de `{ nome, variaveis, blocos }` com as chaves dos objetos em ordem
  alfabética, em todos os níveis. A ordem dos **arrays** é preservada (ordem de blocos e
  de variáveis é conteúdo).
- `formato` e `versao` são ignorados.
- Campos ausentes viram valores neutros: `nome` → `''`, `variaveis` → `[]`,
  `blocos` → `{}`.
- Determinística: mesma entrada, mesmo texto; não altera a entrada.

## `haAlteracoes(projeto, referencia) → boolean`

- `referencia`: texto devolvido antes por `assinaturaProjeto`.
- Devolve `assinaturaProjeto(projeto) !== referencia`.

## Casos que os testes DEVEM cobrir

| Caso | Esperado |
| --- | --- |
| Mesmo projeto com chaves em outra ordem (em qualquer nível) | mesma assinatura |
| `nome` diferente | assinatura diferente |
| Variável a mais ou com tipo diferente | diferente |
| Bloco a mais, ou bloco com `x`/`y` diferente | diferente |
| Dois blocos em ordem trocada no array | diferente |
| Só `formato` ou `versao` diferentes | igual |
| `haAlteracoes(p, assinaturaProjeto(p))` | `false` |
| `haAlteracoes(p2, assinaturaProjeto(p1))` com `p2` alterado | `true` |
| Projeto passado não é modificado | `JSON` antes = depois |
