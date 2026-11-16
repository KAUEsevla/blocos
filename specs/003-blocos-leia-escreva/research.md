# Pesquisa (Fase 0): Blocos de entrada e saída (leia/escreva)

Spec: [spec.md](spec.md) (RF-03). Plano: [plan.md](plan.md).

---

## R-01. Inventário: o que já existe e o que a 002 deixou para a 003

**Já na `main`** (008, 001, 007, 002):

- Gerador puro (`src/portugol/gerador.js`) com o `ctx` do
  [registro-blocos.md](../008-portugol-valido/contracts/registro-blocos.md):
  `ctx.valor`, `ctx.variavel`, `ctx.linha`, `ctx.campo`, `ctx.aviso`. Encaixe vazio vira
  `???` + aviso "Falta … do bloco …" (008, FR-005).
- O `ctx.valor` devolve só o `codigo` do filho: a `precedencia` que os blocos de valor
  devolvem ainda não é usada por ninguém (nenhum bloco de operador existe).
- Campo de variável próprio `campo_variavel` (`src/ui/campo-variavel.js`), com o menu
  pt-BR, campo vazio = `???`, serialização `VAR: null` (002, R-05).
- Caixa de blocos com categorias (`src/blocos/caixa-blocos.js`), hoje só "Variáveis"
  (dinâmica, `custom: 'VARIAVEIS'`), e o botão "Criar variável…" (`BOTAO_CRIAR_VARIAVEL`).
- `PRECEDENCIA.PRIMARIO` (`src/portugol/precedencia.js`).
- Blocos de teste `teste_numero`, `teste_soma`, `teste_escreva`, `teste_leia` em
  `tests/auxiliares/blocos-teste.js`.
- Executar continua desabilitado até a 009 (`src/ui/barra.js`); a caixa de entrada do
  `leia` no navegador é da 010.

**Pendências deixadas pela 002** (plan da 002, "Pendências para as specs 003 e 006";
research da 002, R-08). Todas entram nesta spec, por pedido explícito:

| # | Pendência | Onde é resolvida aqui |
| --- | --- | --- |
| P-1 | Caso de aceitação no Core real com `idade <- 15` e `escreva(idade + 1)` → `16` (História 3 da 002). | `escreva-conta-idade.json` (R-10). Exige número e soma: R-03. |
| P-2 | Conferir no Core o valor inicial de cada tipo: `0`, `0.0`, texto vazio, `falso`. | `escreva-valores-iniciais.json` (R-10). |
| P-3 | `leia` usa o mesmo campo de variável da 002 (`campo_variavel`). | `BLOCO_LEIA` (R-05). |

---

## R-02. Comportamento do Core 1.4.1 (levantado em 2026-11-15)

Fonte: `meuPia/analyzers/code_generator.py`, `syntax_analyzer.py` e
`semantic_analyzer.py` do pacote instalado pelo `instalarCore` no Pyodide (só leitura;
nada copiado), e programas executados com o `compilarEExecutar` da 008.

| Tema | Comportamento | Evidência | Consequência |
| --- | --- | --- | --- |
| `escreva(a, b, …)` | Vira `_escreva(a, b, …)` = `print(''.join(_texto(v) for v in valores))`: concatena **sem separador** e termina com quebra de linha. | `escreva("Idade: ", idade)` com 15 → `Idade: 15\n`; `escreva("a", 1, 2.5, verdadeiro)` → `a12.5verdadeiro\n`. | FR-003 (uma linha por escreva) e o caso de borda "valores colados" são do próprio Core: o gerador só emite os valores separados por `, `. |
| Lógico no escreva | `True`/`False` saem como `verdadeiro`/`falso`. | `escreva(ok)` sem atribuir → `falso`. | Saídas esperadas usam as palavras do Portugol. |
| Valor inicial | `inteiro` → `0`, `real` → `0.0`, `cadeia` → `""`, `logico` → `falso`. | `escreva(idade)`, `escreva(altura)`, `escreva(nome)`, `escreva(ok)` → `0\n0.0\n\nfalso\n`; `escreva("[", nome, "]")` → `[]`. | P-2 confirmada; vira caso de aceitação. |
| `escreva()` vazio | Aceito pelo Core (imprime linha vazia). | → `\n`. | O editor ainda assim sinaliza escreva sem valor (spec, caso de borda); nunca emite `escreva()`: o encaixe vazio vira `???`. |
| Mais de 10 valores | Aceito pelo Core. | 11 valores → `1234567891011`. | O limite de 10 (FR-001) é do editor, não do Core. |
| `leia(x)` | Um único **nome** de variável. `leia(i + 1)` e `leia(i, j)` são erro sintático (`esperado ")"`). Ler uma coleção inteira é erro semântico. | Compilação recusada nos dois casos. | Bloco `leia` com **campo** de variável, não encaixe de valor (FR-004, FR-005): expressão e valor fixo ficam impossíveis por construção. |
| Conversão do `leia` | `inteiro` → `int(input())`; `real` → `float(input())`; `logico` → `input().strip().lower() == 'verdadeiro'`; `cadeia` → texto sem conversão. | `verdadeiro`, `VERDADEIRO`, `  verdadeiro ` → verdadeiro; `sim` → falso; `4` em real → `4.0`; texto vazio em cadeia → `""`. | Dica do leia sobre lógico (spec, caso de borda). Espaços nas pontas também são ignorados no lógico (detalhe a mais que a spec, mesmo resultado para o estudante). Número inválido em inteiro/real = `ValueError`, já traduzido pela 008 ("O valor digitado não é um número"). |
| Entrada esgotada | `input()` sem linha = `EOFError`, já traduzido pela 008. | — | Caso de aceitação com `statusEsperado: "erro_execucao"` é opcional; a 010 cuida da entrada no navegador. Entrada interativa e mensagem da vírgula na [010](../010-entrada-de-dados/research.md) (R-02, R-07). |
| Números | `007` passa no parser, mas o Python gerado é inválido: **"Erro interno do compilador: código Python gerado inválido (leading zeros…)"**. `00.5` funciona. `.5` é erro sintático. Inteiros grandes funcionam. | Executados. | O bloco de número normaliza o texto (R-07). Lacuna do Core → issue (R-07). |
| Precedência | Confirma a escala da 008/R-02: `2 * (3 + 4)` = 14, `10 - (3 - 2)` = 9, `10 - 3 - 2` = 5, `8 / (2 * 2)` = 2.0, `8 / 2 * 2` = 8.0, `7 / 2` = 3.5, `7 % 2` = 1. | Executados. | Regra de parênteses do R-06. |
| Textos | `\"` e `\\` dentro do texto: `"a\"b\\c"` → `a"b\c`. **`\n` dentro do texto vira quebra de linha** (o conteúdo vira literal Python). `"a" + 1` → `a1`. | Executados. | O bloco de texto escapa `\` antes de `"` (R-08), senão um `\n` digitado pelo estudante sairia como quebra de linha (FR-007 da 006). |

---

## R-03. Blocos da 006 antecipados nesta spec

**Decisão** (tomada pelo usuário em 2026-11-15): a 003 entrega, **já completos pelas
regras da spec 006**, três blocos de valor:

| Bloco | Requisitos da 006 atendidos aqui |
| --- | --- |
| `numero` (valor fixo de número) | FR-004 (número inteiro ou real), FR-006 (vírgula vira ponto), caso de borda "número inválido recusado no próprio bloco". |
| `texto` (valor fixo de texto) | FR-004 (texto), FR-007 (aspas e barra invertida saem como digitadas), casos de borda "texto vazio gera `""`" e "aspas ou barra". |
| `aritmetico` (`+ - * / %`) | FR-001 (exceto o negativo `-x`), FR-005 (parênteses pela estrutura), FR-008 (rótulos amigáveis), casos de borda "soma de texto com número" e "divisão por zero não bloqueada". |

As tasks desses blocos citam **RF-06** (e não RF-03), e os commits usam
`003/Txxx (RF-06): …`, para a cadeia commit → task → requisito ficar correta.

**Fica para a 006**: negativo (`-x`), relacionais, lógicos (`e`, `ou`, `nao`), valor
fixo lógico (`verdadeiro`/`falso`), os `check` de tipo das entradas e saídas (SC-002
da 006) e os cenários de aceitação dela que dependem desses blocos. A 006 recebe os três
blocos prontos e só os amplia (mesmo `type`, mesmas variantes), sem migrar projetos.

**Motivo**: o próprio "Olá, mundo!" da História 1 precisa do bloco de texto, e P-1
precisa de número e soma. A aceitação roda só com o `registroPadrao` (blocos reais);
blocos de teste não servem para os casos no Core. Um bloco de soma isolado seria
trocado pelo aritmético na 006, mudando o `type` salvo nos projetos; por isso o
aritmético vem inteiro, com as cinco variantes.

**Alternativas consideradas**: só número, texto e `+` (mínimo estrito; rejeitada pelo
retrabalho de tipo na 006); fazer a 006 antes da 003 (rejeitada pelo usuário); casos
de aceitação com os blocos de teste (rejeitada: os blocos de teste não são do editor e
a meta-verificação da 008 só olha o `registroPadrao`).

---

## R-04. Bloco `escreva` com 1 a 10 valores

**Decisão**:

- Bloco de comando `escreva` com encaixes de valor `VALOR1` … `VALORn`, `n` de 1 a 10,
  em linha (`inputsInline`). A quantidade fica no estado extra serializado:
  `extraState: { valores: n }` (ausente ou inválido = 1; acima de 10 = 10).
- Gera `escreva(v1, v2, …, vn)` na ordem dos encaixes (FR-001). Cada encaixe vazio vira
  `???` com o aviso "Falta o valor do bloco escreva" (n = 1) ou "Falta o valor k do bloco
  escreva" (n > 1), regra da 008. Assim "escreva sem nenhum valor" é sempre sinalizado.
- **Acrescentar e remover** (FR-002): dois ícones no próprio bloco, "+" (acrescenta um
  encaixe no fim, até 10) e "−" (remove o último, mínimo 1). Se o encaixe removido tinha
  um bloco, esse bloco sai e fica solto na área (some do Portugol, regra da 007) e o
  Ctrl+Z volta tudo. Os ícones somem nos limites (sem "+" com 10, sem "−" com 1).
- A parte pura (contar e normalizar `valores`, nomes dos encaixes, texto gerado) fica
  em `src/blocos/entrada-saida.js`. A ligação com o Blockly (mutator com
  `saveExtraState`/`loadExtraState`, os ícones e o evento de mudança para o desfazer)
  fica em `src/ui/mutador-escreva.js`, fora da cobertura, registrada antes das
  definições como o `campo_variavel`.
- Variantes para a meta-verificação: "um valor" (`valores` = 1) e "vários valores"
  (`valores` > 1).

**Motivo**: o mutator padrão do Blockly abre um mini-workspace de arrastar, difícil
para o iniciante; ícones de "+"/"−" no bloco resolvem com um clique. O estado extra em
JSON é o mecanismo padrão do Blockly 12 e continua puro para o gerador.

**Alternativas consideradas**: blocos `escreva` separados por quantidade de valores
(rejeitada: muitos blocos na caixa); um único encaixe com um bloco "junta" (rejeitada:
foge do `escreva(v1, v2)` do Portugol, princípio V); o plugin `@blockly/block-plus-minus`
(rejeitada: dependência nova sem necessidade, princípio VI).

---

## R-05. Bloco `leia` com o campo de variável da 002 (P-3)

**Decisão**:

- Bloco de comando `leia` com um único campo `VAR` do tipo `campo_variavel`, definido
  pela mesma função `campoVariavel()` usada em `src/blocos/variaveis.js` (passa a ser
  exportada por um módulo comum, `src/blocos/campo-variavel.js`, puro). Aceita os
  quatro tipos.
- Gera `leia(nome)` via `ctx.variavel(bloco, 'VAR', 'a variável')`. Sem variável:
  `leia(???)` + "Falta a variável do bloco leia" (cenário 2 da História 2).
- Não há encaixe de valor: expressões e valores fixos não encaixam (FR-005), o que
  também evita o erro sintático do Core (R-02).
- Menu, renomear, mudar o tipo e apagar vêm de graça do campo da 002; apagar a variável
  remove o `leia` como os outros usos (contagem do 002/R-06, que já percorre qualquer
  bloco com campo `VAR`).
- Dica (FR-006): "Pede um valor a quem usa o programa e guarda na variável. Numa
  variável lógica, só “verdadeiro” vira verdadeiro; o resto vira falso." (caso de borda
  do lógico, regra do R-02).

**Motivo**: reaproveitar o campo garante o mesmo comportamento de variável em todo o
editor e o mesmo `{ id }` serializado que a 011/012 já esperam.

---

## R-06. Parênteses: `ctx.valor` com precedência mínima

**Decisão**: o `ctx.valor` da 008 ganha um quarto parâmetro opcional:

```js
ctx.valor(bloco, encaixe, parte, precedenciaMinima = 0) → string
```

Se o filho devolver `precedencia < precedenciaMinima`, o código volta entre
parênteses. Encaixe vazio (`???`) e bloco desconhecido nunca levam parênteses. Sem o
parâmetro o comportamento é o de hoje (nenhum bloco atual muda).

O `aritmetico` pede, para o operador de nível `p`: lado esquerdo `p`, lado direito
`p + 1` (os operadores são associativos à esquerda no Core). A escala ganha dois níveis
em `PRECEDENCIA`: `ADITIVO: 50` (`+ -`) e `MULTIPLICATIVO: 60` (`* / %`), na posição da
escala da 008/R-02; a 006 acrescenta os demais.

| Blocos | Portugol | Por quê |
| --- | --- | --- |
| `(a + b) − c` | `a + b - c` | esquerda 50 ≥ 50 |
| `a − (b − c)` | `a - (b - c)` | direita 50 < 51 |
| `(a + b) × 2` | `(a + b) * 2` | esquerda 50 < 60 |
| `a ÷ (b × c)` | `a / (b * c)` | direita 60 < 61 |
| `(a ÷ b) × c` | `a / b * c` | esquerda 60 ≥ 60 |

Comandos (`escreva`, `recebe`) não pedem precedência: o valor inteiro nunca precisa de
parênteses ali.

**Motivo**: o contrato da 008 já previa que "a 006 usa isso para os parênteses"; um
parâmetro opcional mantém o gerador e todos os blocos atuais intactos. Menos parênteses
que "sempre parentesear" deixa o Portugol parecido com o que o estudante escreveria.

**Alternativas consideradas**: sempre pôr parênteses em operador dentro de operador
(rejeitada: `(a + b) + c` polui o texto); `ctx.valorComPrecedencia` devolvendo o objeto
(rejeitada: cada bloco repetiria a regra de parênteses).

---

## R-07. Bloco `numero`: o que aceita e como gera

**Decisão**: campo de texto `NUM` (não `field_number`, que não aceita vírgula). A regra
pura `normalizarNumero(texto) → string | null` fica em `src/blocos/valores.js`:

1. tira os espaços das pontas;
2. aceita só `dígitos` ou `dígitos` + `,` ou `.` + `dígitos` (`3`, `3,5`, `3.5`, `0,25`);
   qualquer outra coisa (`12a`, `.5`, `5.`, `1.000,5`, `-3`, `1e3`, vazio) devolve `null`;
3. troca `,` por `.` (FR-006 da 006);
4. tira os zeros à esquerda da parte inteira, deixando um (`007` → `7`, `00,5` → `0.5`).

O validador do campo (interface) chama a regra: `null` recusa a edição e o campo volta
ao valor anterior (caso de borda da 006). O valor guardado já é o normalizado, e o
`gerar` normaliza de novo (`{ codigo: normalizarNumero(NUM), precedencia: PRIMARIO }`),
para que um arquivo editado à mão com `007` também gere `7`. Valor inicial do bloco: `0`.
Número negativo fica para o bloco de negativo da 006 (o campo recusa `-`).

Variantes: "inteiro" (sem ponto) e "real" (com ponto).

**Lacuna do Core**: `007` passa no lexer e no parser, mas o Python gerado é inválido e o
Core devolve "Erro interno do compilador". O passo 4 é o adapter do lado do editor
(princípio I). A issue em `meuPia/core` ("Inteiro com zeros à esquerda gera Python
inválido") foi aberta pela dupla, como na 008/R-09:
[meuPia/core#15](https://github.com/meuPia/core/issues/15).

**Texto da issue** (T032; a dupla abre em `meuPia/core` e põe o link aqui):

> **Título**: Inteiro com zeros à esquerda gera Python inválido
>
> **Versão**: `meupia-core` 1.4.1 (PyPI), rodando no Pyodide 0.25.0.
>
> **Passos**: compilar o programa
>
> ```text
> algoritmo "T"
> inicio
>     escreva(007)
> fim_algoritmo
> ```
>
> **Esperado**: um erro léxico em português apontando o número, ou o número 7.
>
> **Obtido**: o lexer e o parser aceitam `007`, e a compilação termina com
> "Erro interno do compilador: código Python gerado inválido (leading zeros in decimal
> integer literals are not permitted; use an 0o prefix for octal integers, …)". `00.5`
> funciona.
>
> **Contorno no meuPiá Blocos**: o bloco de número tira os zeros à esquerda antes de gerar
> o Portugol (`normalizarNumero`, `src/blocos/valores.js`).

**Link da issue**: [meuPia/core#15](https://github.com/meuPia/core/issues/15).

**Alternativas consideradas**: `field_number` do Blockly (rejeitada: recusa vírgula e
mostra números com formatação do navegador); gerar o texto como digitado (rejeitada:
`007` quebra a compilação).

---

## R-08. Bloco `texto`: escape

**Decisão**: campo de texto `TEXTO` (valor inicial vazio). `gerarTexto(conteudo)` em
`src/blocos/valores.js` troca `\` por `\\` **e depois** `"` por `\"` e põe entre aspas
duplas. Texto vazio gera `""`. Precedência `PRIMARIO`. O bloco mostra o texto entre
aspas tipográficas (“ ”) para o iniciante ver que é um texto.

Variantes: "simples" e "com aspas ou barra" (o texto contém `"` ou `\`), para a
meta-verificação exigir um caso no Core que prove o FR-007 da 006.

**Motivo**: R-02 mostrou que o Core interpreta `\n` dentro do texto; sem escapar a
barra, o texto digitado `a\nb` sairia em duas linhas. A ordem (barra antes de aspas) é a
única que não duplica a barra das aspas.

---

## R-09. Caixa de blocos

**Decisão**: três categorias novas em `CAIXA_BLOCOS`, depois de "Variáveis":

| Categoria | Conteúdo |
| --- | --- |
| **Entrada e saída** (dinâmica, `custom: 'ENTRADA_SAIDA'`) | Sempre um `escreva` com um bloco `texto` “Olá, mundo!” encaixado (SC-002: arrastar e pronto). Com variáveis: um `leia` com a última variável da lista do mapa (mesma regra do "recebe" da 002). Sem variáveis: o rótulo "Para usar o leia, crie uma variável primeiro." e o botão "Criar variável…" (mesmo `callbackKey` da 002), caso de borda "leia num projeto sem variáveis". |
| **Valores** (estática) | `numero` (0) e `texto` (vazio). A 006 acrescenta o lógico. |
| **Contas** (estática) | `aritmetico` com `+`. A 006 acrescenta "Comparações" e "Lógica". |

O conteúdo da categoria dinâmica é puro (`conteudoCategoriaEntradaSaida(variaveis)` em
`src/blocos/caixa-blocos.js`); a interface registra o callback como faz com
"Variáveis". O bloco encaixado no `escreva` da caixa é um bloco normal (não *shadow*),
porque o gerador só lê `inputs.X.block`.

**Motivo**: o "Olá, mundo!" sai com dois cliques (categoria → arrastar). Explicar o
`leia` sem variável na própria caixa é mais claro que mostrar um bloco que não funciona.

---

## R-10. Casos de aceitação no Core real

**Decisão**: casos novos em `tests/aceitacao/casos/`, todos com `portugolEsperado` e
`saidaEsperada`:

| Arquivo | Programa | Saída esperada | Cobre |
| --- | --- | --- | --- |
| `escreva-ola-mundo.json` | `escreva("Olá, mundo!")` | `Olá, mundo!\n` | História 1; `escreva` "um valor"; `texto` "simples". |
| `escreva-varios-valores.json` | `idade <- 15`; `escreva("Idade: ", idade)`; `escreva("a", 1, 2,5)` | `Idade: 15\na12.5\n` | Cenários 2 e 3 da História 1; valores colados; "vários valores"; `numero` "inteiro" e "real" (vírgula). |
| `escreva-conta-idade.json` | `idade <- 15`; `escreva(idade + 1)` | `16\n` | **P-1** (História 3 da 002). |
| `escreva-valores-iniciais.json` | quatro variáveis sem atribuir; `escreva(idade)`, `escreva(altura)`, `escreva(nome)`, `escreva(ok)`, `escreva("[", nome, "]")` | `0\n0.0\n\nfalso\n[]\n` | **P-2**. |
| `leia-quatro-tipos.json` | `leia` de `nome`, `idade`, `altura`, `ok`; `escreva("Oi, ", nome)`, `escreva(idade + 1)`, `escreva(altura)`, `escreva(ok)`; entrada `Ana`, `15`, `1.5`, `VERDADEIRO` | `Oi, Ana\n16\n1.5\nverdadeiro\n` | História 2 (teste independente); **P-3** com o bloco real; conversão do lógico sem diferenciar maiúsculas. Real digitado com vírgula (`1,5`) é recusado pelo Core (`float`), assunto da 010. Entrada interativa e mensagem da vírgula na [010](../010-entrada-de-dados/research.md) (R-02, R-07). |
| `leia-logico-falso.json` | `leia(ok)`; `escreva(ok)`; entrada `sim` | `falso\n` | Caso de borda do lógico. |
| `contas-precedencia.json` | `escreva(2 × (3 + 4))`, `escreva(10 − (3 − 2))`, `escreva(7 ÷ 2)`, `escreva(7 resto 2)`, `escreva("a" + 1)` | `14\n9\n3.5\n1\na1\n` | `aritmetico` nas cinco variantes; parênteses (R-06); concatenação. |
| `texto-especial.json` | três `escreva` com os textos digitados `a"b\c`, `x\ny` (barra seguida de `n`) e vazio | três linhas: `a"b\c`, `x\ny` (com a barra, sem quebra no meio) e uma vazia | `texto` "com aspas ou barra"; FR-007 da 006; texto vazio. |
| `numero-zeros.json` | `numero` com `NUM: "007"` (arquivo editado à mão) → gera `escreva(7)` | `7\n` | Adapter do R-07 no gerador. |

Entrada do `leia` nos casos: a lista `entrada` da 008 (uma linha por `input()`).
Os valores exatos serão escritos nas tasks; os textos acima são a referência. A
meta-verificação da 008 passa a exigir as variantes dos cinco blocos novos.

**Teste de unidade** que acompanha: o mesmo `escreva(idade + 1)` com os blocos reais
substitui o uso de `teste_soma`/`teste_numero`/`teste_escreva` nos testes da 002 e da
007 que existiam só por falta deles (os blocos de teste continuam no auxiliar para os
testes do gerador).

---

## R-11. Dependências

**Decisão**: nenhuma dependência nova. Ícones "+"/"−" com `FieldImage` do Blockly 12.5.1
(imagens SVG embutidas como `data:` URI, sem arquivo novo), campos de texto do próprio
Blockly, `<dialog>` não é necessário.

---

## R-12. O que fica para outras specs

| Para | Item |
| --- | --- |
| 006 (✅ resolvida, [tasks da 006](../006-blocos-operadores/tasks.md)) | Negativo, relacionais, lógicos, valor fixo lógico, `check` de tipos (SC-002 da 006), passo B do quickstart da 007 (mudar um número no campo: agora possível, verificado aqui no quickstart, mas o cenário é da 006). |
| 009 (✅ resolvida, [tasks da 009](../009-executar-no-core/tasks.md): Saída com uma linha por `escreva` na tela, T021/T022; executar o "Olá, mundo!" pelo Core na tela. A medição do tempo total com cache limpo é o T025 da 009) | Ver a Saída no navegador ao clicar em Executar (FR-003 e SC-001 aqui são provados pela aceitação no Core; SC-002, "Olá, mundo! em menos de 2 minutos", tem a parte de montar medida aqui e a de executar na 009). |
| 010 | Caixa de entrada do `leia` durante a execução (Premissas da spec). |
