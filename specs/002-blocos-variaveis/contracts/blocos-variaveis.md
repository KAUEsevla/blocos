# Contrato: blocos de variáveis e caixa de blocos

Módulos `src/blocos/variaveis.js`, `src/blocos/caixa-blocos.js`,
`src/portugol/precedencia.js` e `src/projeto/variaveis.js`. Núcleo puro: não importam
`blockly`. Seguem o [contrato do registro da 008](../../008-portugol-valido/contracts/registro-blocos.md).

## Blocos registrados

O `registroPadrao` passa a ter, nesta ordem: `programa`, `variavel_recebe`, `variavel`.

### `variavel_recebe`

```js
export const BLOCO_VARIAVEL_RECEBE = {
  tipo: 'variavel_recebe',
  rotulo: 'recebe',
  categoria: 'comando',
  definicao: {
    type: 'variavel_recebe',
    message0: '%1 recebe %2',
    args0: [
      { type: 'campo_variavel', name: 'VAR', variable: null, variableTypes: TIPOS_VARIAVEL, defaultType: 'inteiro' },
      { type: 'input_value', name: 'VALOR' },
    ],
    previousStatement: null,
    nextStatement: null,
    inputsInline: true,
    tooltip: 'Guarda o valor encaixado na variável',
    // colour: tom da categoria Variáveis
  },
  gerar(bloco, ctx) { /* ctx.linha(`${ctx.variavel(bloco, 'VAR', 'a variável')} <- ${ctx.valor(bloco, 'VALOR', 'o valor')}`) */ },
};
```

- Sem `areas` e sem `variantes` (uma única forma).
- Ordem dos avisos: primeiro a variável, depois o valor (ordem do texto).

### `variavel`

```js
export const BLOCO_VARIAVEL = {
  tipo: 'variavel',
  rotulo: 'variável',
  categoria: 'valor',
  definicao: {
    type: 'variavel',
    message0: '%1',
    args0: [{ type: 'campo_variavel', name: 'VAR', variable: null, variableTypes: TIPOS_VARIAVEL, defaultType: 'inteiro' }],
    output: null,
    tooltip: 'O valor guardado na variável',
  },
  gerar(bloco, ctx) { /* return { codigo: ctx.variavel(bloco, 'VAR', 'a variável'), precedencia: PRECEDENCIA.PRIMARIO } */ },
};
```

- `output: null` nesta entrega; o `check` por tipo é decidido na 006.

### Exemplos normativos (com `gerarPortugol`)

| Blocos no `programa` | Variáveis | Linha(s) em `inicio` | Avisos |
| --- | --- | --- | --- |
| `idade recebe [anos]` | idade, anos: inteiro | `    idade <- anos` | — |
| `idade recebe [ ]` | idade | `    idade <- ???` | "Falta o valor do bloco recebe" |
| `[ ] recebe [ ]` (campo sem id) | — | `    ??? <- ???` | "Falta a variável do bloco recebe", "Falta o valor do bloco recebe" |
| `idade recebe [anos]` com `anos` apagada do mapa | idade | `    idade <- ???` | "Falta a variável do bloco variável" |
| `idade recebe [teste_numero 15]` (bloco de teste) | idade | `    idade <- 15` | — |
| `teste_escreva [teste_soma [idade] [teste_numero 1]]` (blocos de teste) | idade | `    escreva(idade + 1)` | — |

## Precedência

```js
// src/portugol/precedencia.js
export const PRECEDENCIA = Object.freeze({ PRIMARIO: 100 });
```

Maior número = liga mais forte. A 006 acrescenta os níveis dos operadores abaixo de
`PRIMARIO`, seguindo a escala de 008/R-02.

## Caixa de blocos

```js
// src/blocos/caixa-blocos.js
export const CATEGORIA_VARIAVEIS = 'VARIAVEIS';
export const BOTAO_CRIAR_VARIAVEL = 'CRIAR_VARIAVEL';
export const CAIXA_BLOCOS;                        // { kind: 'categoryToolbox', contents: [...] }
export function conteudoCategoriaVariaveis(variaveis: Variavel[]) → FlyoutItem[];
```

Regras de `conteudoCategoriaVariaveis`:

1. Primeiro item: sempre o botão `{ kind: 'button', text: 'Criar variável…', callbackKey: 'CRIAR_VARIAVEL' }`.
2. Sem variáveis, é o único item.
3. Com variáveis: um `variavel_recebe` com `fields.VAR = { id }` da **última** de
   `variaveis`, depois um `variavel` por variável, na ordem da
   seção `var` (agrupada por tipo, ordem de criação dentro do tipo).
4. Não altera `variaveis`; o resultado só depende dela.

A "última de `variaveis`" é a última da lista do mapa do Blockly (research R-04): os
tipos vêm na ordem em que o primeiro de cada um foi criado e, dentro do tipo, na ordem de
criação. Ela é a criada por último quando o tipo dela é o do grupo mais recente; senão é
a última do grupo de tipo mais recente (ex.: `idade`, `nome` (cadeia), `b` → "nome
recebe"). Achado na T029; o estudante troca a variável no próprio bloco.

## Variáveis do projeto

```js
// src/projeto/variaveis.js
variaveisDoMapa(modelos: { getId(), getName(), getType() }[]) → Variavel[]
blocosComVariaveis(blocos: object, variaveis: Variavel[]) → object   // cópia com variables: [{ id, name, type }]
contarBlocosApagados(blocos: object, idVariavel: string) → { usos: number, total: number }
textoApagar(nome: string, { usos, total }) → { titulo, mensagem, confirmar, cancelar }
```

- `variaveisDoMapa` preserva a ordem recebida e ignora modelos cujo tipo não está em
  `TIPOS_VARIAVEL` (não deveriam existir; nada no editor os cria).
- `blocosComVariaveis` não altera `blocos`; substitui uma chave `variables` que já
  exista (008: `variaveis` é a única fonte).
- `contarBlocosApagados` e `textoApagar`: regras e textos do
  [data-model.md](../data-model.md), "Confirmação de apagar". Não alteram a entrada.

## Garantias testadas

| Garantia | Teste |
| --- | --- |
| Registro | unidade: `registroPadrao.tiposRegistrados()` = `['programa', 'variavel_recebe', 'variavel']`; categorias certas. |
| Linhas e avisos | unidade: cada linha dos exemplos normativos acima, com `gerarPortugol` e o registro real (mais os blocos de teste nas duas últimas). |
| Seção `var` (FR-004) | unidade: as variáveis da História 1, cenário 2 geram exatamente o bloco `var` da spec; sem variáveis não há `var`. |
| Renomear (FR-007) | unidade: o mesmo projeto com o `nome` trocado em `variaveis` muda a declaração e todos os usos, sem mexer em `blocos`. |
| Caixa de blocos | unidade: 0, 1 e 4 variáveis (tipos misturados), conferindo ordem e ids. |
| Variáveis do projeto | unidade: `variaveisDoMapa` com modelos falsos; `blocosComVariaveis` sem mutar e trocando `variables`; `contarBlocosApagados` com uso solto, uso dentro do `programa`, uso com valor encaixado, uso dentro de outro uso e `next` que não conta; `textoApagar` nos quatro casos. |
| Contagem igual à do Blockly | unidade (headless): para os mesmos projetos, `total` é igual ao número de blocos que somem do workspace depois de `deleteVariable`. |
| Core real | aceitação: casos `variaveis-atribuicao`, `variaveis-nomes-limite`, `variaveis-bloco-solto`; a meta-verificação da 008 exige os dois tipos novos. |
