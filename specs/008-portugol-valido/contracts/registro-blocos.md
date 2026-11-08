# Contrato: registro de blocos

Módulo `src/blocos/registro.js`. É o ponto em que as specs 002–006 plugam seus blocos
sem mexer no gerador.

## Entrada do registro

```js
registrarBloco({
  tipo: 'se',                       // = type do Blockly
  rotulo: 'se',                     // nome do bloco nos avisos ("... do bloco se")
  categoria: 'comando' | 'valor',   // comando: encaixa em áreas de comandos; valor: em encaixes de valor
  definicao: { /* JSON de Blockly.defineBlocksWithJsonArray, textos em pt-BR */ },
  gerar(bloco, ctx) { /* ver abaixo */ },
})
```

## Contexto de geração (`ctx`)

| Função | Uso |
| --- | --- |
| `ctx.valor(bloco, encaixe, parte) → string` | Gera a expressão do encaixe de valor. Se estiver vazio, registra o aviso `Falta ${parte} do bloco ${rotulo}` e devolve `???`. Para blocos `valor`, devolve `{ codigo, precedencia }` internamente; a 006 usa isso para os parênteses. |
| `ctx.comandos(bloco, encaixe)` | Emite a cadeia de comandos do encaixe com um nível a mais de indentação. Área vazia não gera nada (é permitida). |
| `ctx.linha(texto)` | Emite uma linha no nível atual (só para blocos `comando`). |
| `ctx.variavel(bloco, campo, parte) → string` | Resolve o `{ id }` do campo para o nome em `projeto.variaveis`. Se faltar ou não existir, registra o aviso e devolve `???`. |
| `ctx.campo(bloco, nome) → any` | Valor bruto de um campo. |
| `ctx.aviso(bloco, encaixe, mensagem)` | Aviso com mensagem própria (ex.: passo 0 na 005). |

Regras:

- `gerar` de bloco `comando` só emite linhas por `ctx.linha`/`ctx.comandos`; `gerar`
  de bloco `valor` retorna `{ codigo, precedencia }`.
- `gerar` não pode ler nada fora de `bloco`, `ctx` e constantes do módulo
  (princípio II).
- A 008 registra apenas o bloco `programa` (chapéu, não apagável, com a área
  `COMANDOS`). O registro rejeita tipos duplicados.
- A meta-verificação da suíte de aceitação percorre `tiposRegistrados()` (SC-002).
