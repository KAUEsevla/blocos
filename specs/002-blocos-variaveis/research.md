# Research: Blocos de variáveis

Fase 0 do [plan.md](plan.md). Cada item segue o formato Decisão / Motivo /
Alternativas consideradas. Fontes: código da `main` (008, 001, 007), o pacote
`meupia-core` 1.4.1 do PyPI (lido, não copiado; princípio I) e o `blockly` 12.5.1
instalado em `node_modules`.

---

## R-01. O que já existe e o que falta

| Requisito | Já existe na `main` | Falta |
| --- | --- | --- |
| FR-001 criar com tipo | `TIPOS_VARIAVEL` em `src/projeto/formato.js`; `projeto.variaveis` no modelo (008). Nenhuma forma de criar na tela; o workspace não tem caixa de blocos. | Caixa de blocos, botão "Criar variável…", diálogo (R-05, R-07). |
| FR-002/FR-003 regra do nome | Lista de nomes recusados levantada na 008/R-10, sem código. | Módulo puro `nome-variavel.js` (R-02, R-03, R-11). |
| FR-004 seção `var` | **Atendido**: `gerarSecaoVar` emite uma linha por variável, agrupada na ordem dos tipos, preservando a ordem da lista dentro do tipo; sem variáveis, não há `var` (testes da 008). | Garantir que a lista chegue ao gerador na ordem de criação (R-04). |
| FR-005 bloco "recebe" | `ctx.variavel` e `ctx.valor` do gerador já dão `???` + aviso quando falta a variável ou o valor. | Registrar `variavel_recebe` (R-05). |
| FR-006 bloco de valor | `ctx.valor` espera `{ codigo, precedencia }` de blocos `valor`. | Registrar `variavel`; constante de precedência (R-05). |
| FR-007 renomear | — | Menu do campo + validação (R-06). |
| FR-008 apagar com confirmação | `confirmar()` da 001 (diálogo pt-BR, Cancelar como padrão). | Contagem de usos e apagar agrupado (R-06). |
| FR-009 globais | O Core 1.4.1 declara as variáveis do `var` como globais do `main()` (`global …`). | Nada: não há escopo local no editor. |
| Pendências da 007 | `tempoReal.notificar` recebe todos os eventos do workspace. | Ver R-10. |

**Conclusão**: o gerador não muda. A 002 acrescenta a regra do nome, dois blocos, a
caixa de blocos e a interface de variáveis.

---

## R-02. Nomes reservados vindos do Core 1.4.1

**Decisão**: recusar, sem diferenciar maiúsculas, todos os nomes destes grupos, lidos
no pacote `meupia-core` 1.4.1:

1. **Palavras-chave do lexer** (`analyzers/lexical_analyzer.py`,
   `match_token_keywords`, sem as formas acentuadas, que o FR-002 já recusa): `ate`,
   `de`, `enquanto`, `e`, `entao`, `escreva`, `faca`, `fim_para`, `fim_se`,
   `fim_enquanto`, `leia`, `nao`, `ou`, `para`, `passo`, `se`, `senao`, `inteiro`,
   `string`, `cadeia`, `real`, `float`, `dicionario`, `filaprioridade`, `algoritmo`,
   `var`, `inicio`, `fim_algoritmo`, `usar`, `funcao`, `retorne`, `fim_funcao`,
   `continue`, `interrompa`, `classe`, `metodo`, `novo`, `fim_classe`, `mod`.
2. **Tipos de contexto** (`utils/builtins.py`, `TIPOS_CONTEXTUAIS`): `lista`,
   `logico`, `vetor`.
3. **Nativos do Core** (`FUNCOES_BUILTIN` e `CONSTANTES_BUILTIN`): `tamanho`, `raiz`,
   `potencia`, `seno`, `cosseno`, `tangente`, `teto`, `piso`, `absoluto`, `filaDupla`,
   `filaPrioridade`, `pi`, `verdadeiro`, `falso`.
4. **Nomes globais do código gerado** (`analyzers/code_generator.py`, cabeçalho do
   runtime e `def main()`): `main`, `sys`, `math`, `heapq`, `deque`, `collections`,
   `FilaPrioridade`.

O lexer compara as palavras-chave com `.lower()` e exige fronteira de palavra
(`is_valid_boundary`): `entrada` ou `senha` não viram `e`/`se`, e não precisam ser
recusados. O Core também usa ajudantes com sublinhado no começo (`_S`, `_texto`,
`_escreva`, `_faixa`, `_Lista`, `_Vetor`, `_INICIAL`, `_elemento`, `_valor_msg`);
nenhum nome que começa com letra (FR-002) colide com eles, então não entram na lista.
Os métodos de coleção (`adicionar`, `pegar`…) só valem depois de `.` e também ficam de
fora.

**Motivo**: o Core traduz cada nome para Python **sem renomear** (008/R-02). Uma
palavra-chave do Portugol quebra a análise (`se: inteiro` não compila); um nome do
runtime quebra a execução (`math` como variável apaga o módulo). Os nativos do grupo 3
até funcionariam no 1.4.1, porque o gerador dá prioridade aos nomes declarados (linha
"Nomes declarados pelo usuario tem prioridade sobre builtins"), mas a 008/R-10 e a spec
já decidiram recusá-los: o estudante que chama uma variável `raiz` perde a função
`raiz` no Portugol escrito.

**Alternativas consideradas**: importar a lista do Core em tempo de execução, dentro
do Pyodide. Rejeitada: a validação precisa funcionar antes de o Pyodide carregar
(vários segundos) e na 012, que valida arquivos sem executar nada. Copiar o arquivo do
Core: proibido pelo princípio I.

---

## R-03. Nomes reservados vindos do Python

**Decisão**: recusar também, sem diferenciar maiúsculas:

- as 35 **palavras-chave do Python 3.11** (`keyword.kwlist`): `False`, `None`, `True`,
  `and`, `as`, `assert`, `async`, `await`, `break`, `class`, `continue`, `def`, `del`,
  `elif`, `else`, `except`, `finally`, `for`, `from`, `global`, `if`, `import`, `in`,
  `is`, `lambda`, `nonlocal`, `not`, `or`, `pass`, `raise`, `return`, `try`, `while`,
  `with`, `yield`;
- **todos os nomes de `dir(builtins)` do Python 3.11 que começam com letra** (as
  exceções `ArithmeticError` … `ZeroDivisionError`, `Ellipsis`, `NotImplemented`, e as
  funções `abs`, `aiter`, `all`, `anext`, `any`, `ascii`, `bin`, `bool`, `breakpoint`,
  `bytearray`, `bytes`, `callable`, `chr`, `classmethod`, `compile`, `complex`,
  `copyright`, `credits`, `delattr`, `dict`, `dir`, `divmod`, `enumerate`, `eval`,
  `exec`, `exit`, `filter`, `float`, `format`, `frozenset`, `getattr`, `globals`,
  `hasattr`, `hash`, `help`, `hex`, `id`, `input`, `int`, `isinstance`, `issubclass`,
  `iter`, `len`, `license`, `list`, `locals`, `map`, `max`, `memoryview`, `min`,
  `next`, `object`, `oct`, `open`, `ord`, `pow`, `print`, `property`, `quit`, `range`,
  `repr`, `reversed`, `round`, `set`, `setattr`, `slice`, `sorted`, `staticmethod`,
  `str`, `sum`, `super`, `tuple`, `type`, `vars`, `zip`).

As *soft keywords* (`match`, `case`, `_`) não entram: são nomes válidos em Python e
`_` já é recusado por não começar com letra.

O Pyodide 0.25.0 traz o Python 3.11.3. Um teste de aceitação
(`tests/aceitacao/nomes-reservados.test.js`) roda no Pyodide real e confere que
`keyword.kwlist` e todo nome de `dir(builtins)` que começa com letra estão na lista do
editor. Se o Pyodide ou o Core mudarem de versão, o teste aponta o que falta.

**Motivo**: a spec (FR-003) pede os nomes "usados pelo código que o Core gera". Hoje o
runtime usa `print`, `input`, `int`, `float`, `str`, `len`, `range`, `abs`, `list`,
`dict`, `type`, `ValueError`, `TypeError`, `IndexError`, `ImportError` e `exit`, e
esse conjunto cresce a cada bloco novo (003: `input` e conversões; 006: `math`). Uma
variável global com o nome de um *builtin* esconde o *builtin* para o programa
inteiro. Recusar todos os *builtins* fecha a regra de uma vez, sem a 003–006 terem de
revisar a lista. O custo é recusar alguns nomes em inglês (`max`, `min`, `id`, `sum`),
pouco prováveis num programa em português; a mensagem "Este nome é reservado." explica.

**Alternativas consideradas**: só os *builtins* que o runtime do 1.4.1 usa hoje (a
lista da 008/R-10). Rejeitada: frágil, porque cada spec de bloco teria de lembrar de
estender a lista, e um esquecimento só aparece como erro de execução estranho
(SC-002 exige recusar 100% antes do Portugol).

---

## R-04. Fonte das variáveis: o mapa de variáveis do Blockly

**Decisão**: a lista viva de variáveis é o mapa de variáveis do workspace
(`ws.getVariableMap()`), com o tipo do Portugol guardado como **tipo da variável do
Blockly** (`createVariable(nome, 'inteiro', id)`). O `projetoAtual()` do `main.js`
passa a montar `variaveis` com `variaveisDoMapa(ws.getVariableMap().getAllVariables())`
a cada geração. Para carregar um projeto (Novo, e a 012 depois), o workspace recebe as
variáveis junto com os blocos: `blocosComVariaveis(projeto.blocos, projeto.variaveis)`
devolve a serialização com a chave `variables` na ordem de `projeto.variaveis`.

Comportamento conferido no `blockly` 12.5.1:

- `VariableMap.getAllVariables()` percorre os tipos na ordem em que o primeiro de cada
  tipo foi criado e, dentro do tipo, na ordem de inserção. Como o gerador reagrupa por
  tipo (inteiro, real, cadeia, logico) e preserva a ordem dentro do tipo, a seção `var`
  sai como manda o FR-004.
- `changeVariableType` tira a variável do tipo antigo e a põe **no fim** do tipo
  novo. Mudar o tipo equivale a "criar de novo" naquele tipo; o efeito na seção `var`
  é a variável ir para o fim do grupo novo. Aceito e documentado no
  [data-model.md](data-model.md).
- Criar, renomear, mudar o tipo e apagar disparam eventos não-UI (`var_create`,
  `var_rename`, `var_type_change`, `var_delete`), que entram na pilha de desfazer do
  Blockly e chegam ao `tempoReal.notificar` da 007. Desfazer o apagar recria a
  variável (no fim do tipo dela) e os blocos.
- `workspaces.load` limpa o workspace, inclusive as variáveis, e cria as da chave
  `variables` na ordem do array.

**Motivo**: é o mesmo modelo que o Blockly usa nos campos de variável (`{ id }` no
JSON, como a 008 já espera) e dá de graça o desfazer, a atualização em tempo real e a
troca do nome em todos os usos (FR-007). Um segundo modelo em `projeto.variaveis`
mantido à mão divergiria do workspace no primeiro Ctrl+Z. A serialização continua
sem `blocos.variables` (`serializarBlocos` já apaga a chave): `variaveis` segue sendo
a única lista no arquivo (008, data-model, "Origem das variáveis").

**Alternativas consideradas**: `projeto.variaveis` como fonte e o workspace como
espelho, com `tempoReal.solicitar()` a cada mudança (o gancho que a 007 deixou).
Rejeitada: exigiria um desfazer próprio para variáveis, sincronizado com o do Blockly.

---

## R-05. Blocos, campo de variável e caixa de blocos

**Decisão**:

- `variavel_recebe` (comando): `%1 recebe %2`, campo `VAR` + encaixe de valor
  `VALOR`. Gera `nome <- valor` com `ctx.variavel(bloco, 'VAR', 'a variável')` e
  `ctx.valor(bloco, 'VALOR', 'o valor')`. Rótulo nos avisos: `recebe` ("Falta o valor
  do bloco recebe").
- `variavel` (valor): só o campo `VAR`. Gera `{ codigo: nome, precedencia:
  PRECEDENCIA.PRIMARIO }`. `output: null` nesta entrega; o `check` por tipo é da 006
  (R-08).
- O campo `VAR` usa um tipo de campo próprio, `campo_variavel`, que estende o
  `FieldVariable` do Blockly com `variableTypes` = os quatro tipos. A definição JSON
  do bloco só cita o nome do campo (continua pura); a interface registra a classe
  com `Blockly.fieldRegistry.register` antes do `defineBlocksWithJsonArray`.
- Campo sem variável (decidido na T005, plano A): `initModel()` não cria variável e
  `getText()` mostra `???`. No 12.5.1 o `FieldVariable` também supõe uma variável em
  `saveState()`, `toXml()` (usado pelo evento de criação do bloco) e `dropdownCreate()`,
  então o campo próprio cobre os três: serializa `VAR: null` (o gerador já trata como
  "Falta a variável…"), grava `<field>` vazio e mostra o menu das variáveis existentes.
  Como sobrescrever `fromXml()` sozinho faz o Blockly carregar o JSON pelo XML
  ("estado legado"), `loadState()` também é sobrescrito. O construtor aponta
  `menuGenerator_` para o menu da subclasse (o original usa o da classe base).
- A caixa de blocos passa a ter categorias. A 002 cria a categoria "Variáveis"
  com `custom: 'VARIAVEIS'`; a interface registra o *callback* com
  `ws.registerToolboxCategoryCallback`, que devolve
  `conteudoCategoriaVariaveis(variaveis)` (puro): o botão "Criar variável…"; se houver
  variáveis, um `variavel_recebe` com a última da lista do mapa e um `variavel` para cada
  variável, na ordem da seção `var`.
- Precedência: `src/portugol/precedencia.js` exporta `PRECEDENCIA.PRIMARIO`. A 006
  acrescenta os níveis dos operadores na mesma constante.

**Motivo**: o `FieldVariable` padrão abre o `window.prompt` do navegador para
renomear, usa as mensagens do Blockly (sem a regra do FR-002/FR-003) e, sem variável,
cria uma chamada `item`. O campo próprio troca só o menu (R-06), mantendo o resto (ids,
serialização, renomear em todos os usos). A categoria dinâmica é o mecanismo padrão do
Blockly para variáveis. Mostrar só um "recebe" evita uma caixa longa: o estudante troca
a variável no próprio bloco.

**Alternativas consideradas**: a categoria `VARIABLE_DYNAMIC` do próprio Blockly
(cria variáveis com tipo). Rejeitada: textos fixos em inglês nos botões de tipo, blocos
`variables_get_dynamic`/`variables_set_dynamic` com o rótulo "set … to" e
`window.prompt` no nome. Sobrescrever `Blockly.dialog.setPrompt`: resolveria o
`prompt`, mas não a escolha do tipo nem as mensagens de recusa.

---

## R-06. Renomear, mudar o tipo e apagar

**Decisão**: o menu do campo `campo_variavel` lista as variáveis (como o padrão) e, no
fim, três itens: "Renomear variável…", "Mudar o tipo…" e "Apagar a variável
“nome”". O tratamento fica em `src/ui/acoes-variavel.js`:

- **Renomear**: diálogo com o nome atual; valida com `validarNomeVariavel(nome,
  variaveis, { ignorarId })`, que deixa trocar só maiúsculas da própria variável
  (`idade` → `Idade`). Aplica com `ws.getVariableMap().renameVariable(variavel,
  nome)`; o Blockly atualiza todos os campos (FR-007).
- **Mudar o tipo**: diálogo com o tipo atual; aplica com `changeVariableType`.
  Permitido mesmo com a variável em uso (caso de borda); o Core aponta incompatibilidade
  ao executar (009).
- **Apagar**: conta com `contarBlocosApagados(serializarBlocos(ws), id)` (puro), que
  devolve os usos e o **total real** de blocos removidos: os usos mais os blocos
  encaixados neles. Sem usos, apaga direto. Com usos, chama o `confirmar()` da 001 com
  `textoApagar(nome, { usos, total })` (puro) e só apaga se o estudante confirmar
  (FR-008). Aplica com `ws.getVariableMap().deleteVariable(variavel)`, que no 12.5.1
  agrupa os eventos (um Ctrl+Z desfaz tudo) e apaga cada bloco de uso com
  `dispose(true)`: o comando seguinte sobe para o lugar dele (não conta no total), e os
  blocos encaixados nos valores e nas áreas de comandos do bloco apagado saem junto
  (contam no total). A contagem sobre o JSON é pura e testável em Node; um teste no
  Blockly headless confere que ela bate com o que o `deleteVariable` remove.

A confirmação embutida do Blockly (`Blockly.Variables.deleteVariable`, com o
`window.confirm` e a contagem que soma o bloco do menu) não é usada.

**Motivo**: a contagem e o texto precisam ser pt-BR e seguir a spec (FR-008: "informando
quantos blocos serão removidos"). Contar só os usos esconderia os blocos encaixados
neles, que também somem (achado U1 do analyze). O diálogo da 001 já deixa Cancelar como padrão.

**Alternativas consideradas**: apagar a variável pela lixeira do workspace ou pelo
menu de contexto do bloco. Não existem para variáveis no Blockly; só o campo e a
caixa de blocos as mostram.

---

## R-07. Diálogo de variável e SC-003

**Decisão**: um único `<dialog id="dialogo-variavel">` no `index.html`, com três
modos (criar, renomear, mudar o tipo):

- campo de nome (oculto no modo "mudar o tipo"), com `maxlength` de 30;
- lista de tipos (oculta no modo "renomear"), com o valor do Portugol e uma dica:
  `inteiro (número sem vírgula)`, `real (número com vírgula)`, `cadeia (texto)`,
  `logico (verdadeiro ou falso)`; o padrão é `inteiro`;
- parágrafo de erro com `role="alert"`, preenchido com a mensagem de
  `validarNomeVariavel` ao confirmar; o diálogo **não fecha** enquanto o nome é
  recusado (SC-002);
- botões "Criar" / "Renomear" / "Mudar o tipo" e "Cancelar"; Enter confirma, Esc
  cancela.

Caminho do SC-003: abrir a categoria "Variáveis" → "Criar variável…" → digitar o nome
e Enter → arrastar o "recebe" que aparece com a variável nova → encaixar o valor. Seis
gestos.

**Motivo**: os tipos aparecem com a palavra exata do Portugol (princípio V), e a dica
ajuda quem não sabe a diferença entre inteiro e real. O erro no próprio diálogo evita
o estudante perder o que digitou.

**Alternativas consideradas**: um diálogo para cada ação. Rejeitada: três vezes o mesmo
HTML e o mesmo código de foco/teclado.

---

## R-08. O que a aceitação da 002 cobre e o que fica para 003/006

**Decisão**: casos novos em `tests/aceitacao/casos/`, todos no Core real:

- `variaveis-atribuicao.json`: `a`, `b` inteiros e `nome` cadeia; `a <- b`,
  `b <- a`, `nome <- nome`; `portugolEsperado` completo; saída vazia. Cobre os dois
  tipos novos na meta-verificação da 008 (SC-002 da 008).
- `variaveis-nomes-limite.json`: nomes válidos parecidos com reservados ou nos
  limites (`entrada`, `senha`, `E1`, `dado_2`, `x`, `Resultado`, um nome de 30
  caracteres, `MeuPrograma` igual ao nome do programa), nos quatro tipos, com uma
  atribuição cada. Prova o SC-001: nomes aceitos pela regra rodam no Core.
- `variaveis-bloco-solto.json`: uma atribuição dentro do `programa` e uma solta
  fora dele; a solta não aparece no `portugolEsperado` (pendência da 007).

Os cenários `idade <- 15` e `escreva(idade + 1)` são testados na unidade com os
blocos de teste `teste_numero`, `teste_soma` e `teste_escreva` (passam a ficar em
`tests/auxiliares/blocos-teste.js`). Viram caso de aceitação na 006 e na 003, junto
com o caso que confere o valor inicial de cada tipo (ver "Pendências" no plan).

**Motivo**: a 002 não pode trazer o bloco de número (006) nem o `escreva` (003) sem
invadir essas specs. `b <- a` já é Portugol completo e aceito pelo Core.

**Alternativas consideradas**: um bloco de número provisório na 002. Rejeitada:
seria código de outra spec, sem os requisitos dela (vírgula, notação científica).

---

## R-09. Dependências

**Decisão**: nenhuma dependência nova. Tudo usa `blockly` 12.5.1 (campo de variável,
mapa de variáveis, categorias dinâmicas, `fieldRegistry`) e o `<dialog>` nativo, já
usado pela 001.

---

## R-10. Pendências da 007 resolvidas aqui

| Pendência (007, tasks, "Pendências para as specs 002 e 003") | Como a 002 resolve |
| --- | --- |
| Chamar `tempoReal.solicitar()` ao mexer em variáveis | Desnecessário: as ações de variável geram eventos não-UI do workspace, que já chegam ao `notificar` (R-04). O gancho continua disponível. |
| Decidir se variáveis entram no desfazer | Entram, pela pilha do Blockly (R-04, R-06). |
| Caso de aceitação com bloco de comando real solto | `variaveis-bloco-solto.json` (R-08). |
| Passos A, C–J do quickstart da 007 | Seção 3 do [quickstart.md](quickstart.md) desta spec, com o bloco "recebe". O passo B (mudar um número) precisa do bloco de número e passa para a 006. |

---

## R-11. Ordem das verificações e mensagens

**Decisão**: `validarNomeVariavel` tira os espaços das pontas e verifica nesta ordem,
parando na primeira regra quebrada:

| # | Regra | Mensagem | Exemplo |
| --- | --- | --- | --- |
| 1 | Vazio | "Digite um nome para a variável." | `""`, `"   "` |
| 2 | Mais de 30 caracteres | "O nome pode ter no máximo 30 caracteres." | 31 letras |
| 3 | Espaço no meio | "O nome não pode ter espaços. Use _ no lugar, como em minha_idade." | `minha idade` |
| 4 | Letra com acento ou `ç` | "Use letras sem acento e sem ç." | `ação`, `ânimo` |
| 5 | Outro caractere fora de `A–Z a–z 0–9 _` | "Use só letras, números e _ no nome." | `a-b`, `x!` |
| 6 | Não começa com letra | "O nome precisa começar com uma letra." | `2lugar`, `_x` |
| 7 | Reservado (R-02, R-03), sem diferenciar maiúsculas | "Este nome é reservado." | `se`, `Print`, `MAIN` |
| 8 | Igual a outra variável, sem diferenciar maiúsculas | "Já existe a variável <nome existente>." | `Idade` com `idade` |

**Motivo**: a spec pede "uma mensagem que explica a regra quebrada" (História 1,
cenário 3). A ordem põe primeiro o que o estudante corrige digitando e deixa por
último as regras que dependem do contexto. Acento vem antes de "começar com letra"
para `ânimo` receber a dica certa.

**Alternativas consideradas**: listar todas as regras quebradas de uma vez. Rejeitada:
texto longo para o iniciante; corrigir uma de cada vez é mais claro.
