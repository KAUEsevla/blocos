# Contrato: registro de blocos

Módulo `src/blocos/registro.js`. É o ponto em que as specs 002–006 plugam seus blocos
sem mexer no gerador.

## Entrada do registro

```js
registrarBloco({
  tipo: 'se',                       // = type do Blockly
  rotulo: 'se',                     // nome do bloco nos avisos ("... do bloco se")
  categoria: 'comando' | 'valor' | 'raiz',
  definicao: { /* JSON de Blockly.defineBlocksWithJsonArray, textos em pt-BR */ },
  gerar(bloco, ctx) { /* ver abaixo */ },
  areas: ['ENTAO', 'SENAO'],        // opcional (padrão []): áreas de comandos do bloco
  variantes: [                      // opcional (padrão []): formas que a suíte precisa cobrir
    { nome: 'sem senão', presente: (bloco) => !bloco.extraState?.senao },
    { nome: 'com senão', presente: (bloco) => bloco.extraState?.senao === true },
  ],
  tipoPelaVariavel: 'saida' | 'VALOR', // opcional (spec 006): ver "Tipos dos encaixes"
})
```

### Tipos dos encaixes (`check` e `tipoPelaVariavel`, spec 006)

| Chave | Regra |
| --- | --- |
| `check` em `definicao.output` e nos `input_value` | Tipo de saída e tipos aceitos (`Numero`, `Texto`, `Logico`); ausente = qualquer. Seguem [tipos-encaixe.md](../../006-blocos-operadores/contracts/tipos-encaixe.md) da 006 e **não entram no gerador**. |
| `tipoPelaVariavel` (opcional) | `'saida'` ou o nome de um `input_value`: o tipo daquele ponto vem da variável do campo `VAR` (`inteiro`/`real` → `Numero`, `cadeia` → `Texto`, `logico` → `Logico`). O registro recusa outro valor ou bloco sem campo `VAR`. |

### Categorias

| Categoria | Onde encaixa | O que `gerar` faz |
| --- | --- | --- |
| `comando` | Áreas de comandos | Emite linhas por `ctx.linha`/`ctx.comandos` e não retorna valor. |
| `valor` | Encaixes de valor | Retorna `{ codigo, precedencia }`. |
| `raiz` | Topo do workspace (só o `programa`) | Nada; o gerador trata a raiz diretamente. |

### Áreas (`areas`)

Nomes dos encaixes de comandos do bloco (ex.: `CORPO`, `ENTAO`, `SENAO`). Servem
para documentar o bloco e para a regra da suíte de aceitação: todo caso que contém um
bloco não `raiz` com `areas` não vazias precisa ter `portugolEsperado`. Isso garante
que a indentação real dos blocos aninhados seja conferida no texto e no Core.

### Variantes (`variantes`)

Formas diferentes de um mesmo tipo que geram Portugol diferente: cada operador de uma
lista de escolha, o `se` com e sem `senão`, o `para` com e sem `passo`. Cada variante
tem:

- `nome`: texto em pt-BR, único dentro do bloco (aparece na mensagem de falha da suíte);
- `presente(bloco) → boolean`: função pura que diz se o nó JSON é dessa variante.

Exemplo de operador com campo de escolha:

```js
variantes: ['+', '-', '*', '/', '%'].map((op) => ({
  nome: op,
  presente: (bloco) => bloco.fields?.OP === op,
})),
```

Sem variantes declaradas, `variantesDe(tipo)` devolve uma variante implícita
`{ nome: 'padrão', presente: () => true }`.

**Regra da suíte (SC-002)**: para cada tipo registrado e cada variante, algum caso de
aceitação precisa ter, entre os blocos alcançáveis a partir do `programa`, um bloco
desse tipo para o qual `presente(bloco)` seja `true`. Blocos soltos não contam.

## Contexto de geração (`ctx`)

| Função | Uso |
| --- | --- |
| `ctx.valor(bloco, encaixe, parte, precedenciaMinima = 0) → string` | Gera a expressão do encaixe de valor. Se estiver vazio, registra o aviso `Falta ${parte} do bloco ${rotulo}` e devolve `???`. Se o filho devolver `precedencia < precedenciaMinima`, o código volta entre parênteses; `???` nunca leva parênteses. Regra e escala em [blocos-valores-contas.md](../../003-blocos-leia-escreva/contracts/blocos-valores-contas.md) (spec 003). |
| `ctx.comandos(bloco, encaixe)` | Emite a cadeia de comandos do encaixe com um nível a mais de indentação. Área vazia não gera nada (é permitida). |
| `ctx.linha(texto)` | Emite uma linha no nível atual (só para blocos `comando`). |
| `ctx.variavel(bloco, campo, parte) → string` | Resolve o `{ id }` do campo para o nome em `projeto.variaveis`. Se faltar ou não existir, registra o aviso e devolve `???`. |
| `ctx.campo(bloco, nome) → any` | Valor bruto de um campo. |
| `ctx.aviso(bloco, encaixe, mensagem)` | Aviso com mensagem própria (ex.: passo 0 na 005). |

## Regras

- `gerar` não pode ler nada fora de `bloco`, `ctx` e constantes do módulo
  (princípio II). O mesmo vale para `presente`.
- A 008 registra apenas o bloco `programa`: `categoria: 'raiz'`, `areas: ['COMANDOS']`,
  sem variantes, chapéu e não apagável.
- O registro rejeita tipos duplicados e nomes de variante repetidos no mesmo bloco.
- `tiposRegistrados()` e `variantesDe(tipo)` alimentam a meta-verificação da suíte de
  aceitação.
