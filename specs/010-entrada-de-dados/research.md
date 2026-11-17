# Pesquisa (Fase 0): Entrada de dados durante a execução

Spec: [spec.md](spec.md) (RF-10). Plano: [plan.md](plan.md).

---

## R-01. Inventário e pendências obrigatórias

**Já na `main`** (008, 001, 007, 002, 003, 006, 009):

| Peça | Onde | Origem | Uso nesta spec |
| --- | --- | --- | --- |
| Bloco `leia` com o campo `VAR` (`campo_variavel`) | `src/blocos/entrada-saida.js`, `src/blocos/campo-variavel.js` | 003 (R-05), campo da 002 | Não muda. Gera `leia(nome)`. A variável sempre existe no registro de variáveis (nome e tipo). |
| Registro de variáveis do projeto (`{ id, nome, tipo }`) | `projeto.variaveis`, `variaveisDoWorkspace(ws)` | 002 | Dá o **tipo** da variável pedida (R-03). |
| `compilarEExecutar(motor, codigo, entrada, { aoEscrever })` | `src/core/executor-core.js` | 008, ampliado pela 009 | Ganha o modo interativo e `continuarExecucao` (R-02, R-04). |
| Ponte Python (`_meupia_compilar`, `_meupia_executar`) | `src/core/ponte-python.js` | 008, 009 | `_meupia_executar` passa a ler a entrada de uma lista própria (R-03). |
| Worker de execução, executor, serviço, protocolo | `src/execucao/` | 009 | Ganham `pedido_entrada` e `entrada` (R-04). |
| Controlador de Executar/Parar | `src/execucao/controlador.js` | 009 | Pede o valor à Saída e o registra (R-06, R-08). |
| Painel Saída (`escrever`, `escreverVarias`, …) | `src/ui/painel-saida.js` | 001, 009 | Ganha o campo de entrada (R-08). |
| Tradução de `ValueError` → "O valor digitado não é um número." | `traduzirErroExecucao` | 008, 009 | Ganha o complemento da vírgula (R-07). |

**Pendências obrigatórias de outras specs** (pedido explícito do usuário):

| # | Origem | Pendência | Onde é resolvida |
| --- | --- | --- | --- |
| P-1 | 009, [R-14](../009-executar-no-core/research.md) e plan ("Pendências para outras specs") | Entrada interativa do `leia` **dentro do worker**. Hoje um programa com `leia` executado pela tela recebe entrada vazia e termina com "O programa pediu mais dados do que os informados." | R-02 a R-06 |
| P-2 | 003, [R-02](../003-blocos-leia-escreva/research.md) (linha "Conversão do `leia`" e caso `leia-quatro-tipos.json`), plan da 003 ("010: … mensagem para real digitado com vírgula"); Premissas da 010 | O Core 1.4.1 converte o `leia` de real com `float()`: `1,5` é recusado com `ValueError`. | R-07 |
| P-3 | 002 (campo de variável), entregue no `leia` pela 003 (P-3 da 003, R-05) | O `leia` usa o campo de variável da 002. Nome e tipo mostrados no pedido vêm dessa mesma variável. | R-03 |

---

## R-02. Como pausar a execução no `leia` dentro do worker (P-1)

**Fatos levantados** (Core 1.4.1 no Pyodide 0.25.0, executado em 2026-11-16):

- O Core gera um `main()` síncrono: `nome = _S(input())`, `idade = int(input())`,
  `altura = float(input())`, `ok = input().strip().lower() == 'verdadeiro'`.
- `input()` é chamado no meio do Python síncrono. O worker não pode esperar uma
  mensagem da página sem sair do Python: o laço de eventos do worker fica parado
  enquanto o Python roda.
- Os blocos do editor não têm nada não determinístico: não há número aleatório, data,
  hora nem leitura de arquivo no registro de blocos (`registroPadrao`). O cabeçalho do
  Python gerado só importa `sys`, `math`, `heapq` e `collections.deque`. **Com as mesmas
  entradas, o programa produz sempre a mesma saída e chega aos mesmos `leia`.**

**Decisão: reexecução determinística.**

1. A execução interativa roda com uma lista de entradas já confirmadas (no começo,
   vazia).
2. Quando o programa chama `input()` e a lista acabou, a ponte interrompe o Python com
   uma exceção própria (`_MeupiaPedidoEntrada`, derivada de `BaseException`, para o
   programa nunca a capturar) e devolve **"aguardando entrada"** com o nome da variável
   (R-03).
3. O worker posta `pedido_entrada` e fica livre (nenhum Python rodando). A página mostra
   o campo.
4. O estudante confirma. A página manda `entrada` com o valor. O worker acrescenta o
   valor à lista e **executa de novo o `output/main.py` já compilado**, desde o começo,
   com a lista inteira. A saída que já foi enviada à página é descartada nessa nova
   rodada (R-05).
5. Repete até o programa terminar (ok ou erro) ou o estudante parar.

Protótipo no Core real: `enquanto i < 2` com `leia(nome)` e `escreva("Oi, ", nome)`.
Rodada 1: pedido de `nome`, saída `antes`. Rodada 2 (`["Ana"]`): pedido de `nome`,
saída `antes`, `Oi, Ana`. Rodada 3 (`["Ana", "Bia"]`): fim, saída `antes`, `Oi, Ana`,
`Oi, Bia`.

**Motivo**:

- Não exige `SharedArrayBuffer` nem isolamento entre origens (COOP/COEP). A 009 já
  rejeitou isso para o Parar (R-03 da 009), por exigir cabeçalhos que uma hospedagem
  estática comum não envia (RNF-06). Também não exige service worker nem dependência
  nova (princípio VI).
- Enquanto espera, o worker não ocupa a CPU, e o Parar continua sendo o `terminate()`
  da 009.
- Funciona igual no navegador e no `worker_threads` da aceitação, sem mudar o adaptador.

**Custo aceito**: cada valor confirmado repete o trecho do programa anterior ao `leia`.
Para os programas do iniciante (poucos `leia`, laços pequenos), isso leva milissegundos.
Num programa com uma conta pesada antes de vários `leia`, a resposta depois do Enter
fica mais lenta. É um limite conhecido da PoC, registrado no quickstart.

**Premissa que sustenta a decisão**: os blocos continuam determinísticos. Uma spec que
trouxer número aleatório, data ou hora precisa rever este R-02. A reexecução confere
o prefixo da saída (R-05): se o programa divergir, a execução para com um erro em vez de
mostrar uma Saída errada.

**Alternativas consideradas**:

| Alternativa | Por que foi rejeitada |
| --- | --- |
| `SharedArrayBuffer` + `Atomics.wait` no `stdin` (a sugestão do R-14 da 009) | Exige `crossOriginIsolated`: cabeçalhos COOP/COEP. No GitHub Pages, só com um service worker de terceiros (`coi-serviceworker`), uma dependência nova. O COEP também passa a exigir CORP/CORS de tudo que vem do CDN (Pyodide, wheels do PyPI), mais um ponto de falha na primeira execução. Contradiz a decisão da 009 para o Parar. |
| Recolher a entrada antes de executar (lista de valores) | Viola o FR-001 e a História 1 (o programa pausa **quando chega** no `leia`). A spec deixa a pré-carga fora desta entrega. |
| XHR síncrono do worker respondido por um service worker | Precisa de service worker próprio, com ciclo de vida e atualização. Complexo demais para a PoC. |
| JSPI / `pyodide.ffi.run_sync` (pilha suspensa) | Não existe no Pyodide 0.25.0. Trocar a versão do Pyodide é mudar dependência. O suporte a JSPI ainda varia entre os navegadores-alvo. |
| `SharedArrayBuffer` quando houver isolamento e reexecução nos outros casos | Dois caminhos para a mesma regra, o dobro de testes. Sem ganho para o iniciante. |

---

## R-03. Qual variável o `leia` pede: nome e tipo (P-3)

**Decisão**:

- A ponte troca o `input` do programa por uma função própria, passada no dicionário
  global do `exec` (`{"__name__": "__main__", "input": _meupia_input}`). O nome global
  vence o `builtins.input`. O Core não é alterado: só o ambiente onde o Python gerado
  roda (princípio I).
- `_meupia_input()` devolve o próximo valor da lista **exatamente como digitado**, sem
  acrescentar nem tirar nada (FR-004). Lista esgotada:
  - modo interativo → `_MeupiaPedidoEntrada(nome)`;
  - modo não interativo (aceitação da 008 e chamadas sem `interativo`) → `EOFError`,
    como hoje ("O programa pediu mais dados do que os informados.").
- **Nome**: a linha que chamou `input()` (`sys._getframe(1).f_lineno`) no
  `output/main.py`, lida com `^\s*([A-Za-z_]\w*)\s*=`. O Core gera `nome = …input()…`
  para os quatro tipos (R-02 da 003). Se a linha não casar, o nome é `null`.
- **Tipo**: vem do registro de variáveis da 002 (`projeto.variaveis`), o mesmo que
  alimenta o campo `VAR` do `leia` (P-3). O controlador recebe a lista
  `[{ nome, tipo }]` junto com o código, no clique em Executar, e procura o nome.
  Os nomes do editor nunca são palavras reservadas do Python (002, `NOMES_RESERVADOS`),
  então o nome do Python é o nome da variável.
- **Sem nome ou nome fora do registro**: pedido genérico "Digite um valor", sem dica.
  A execução continua funcionando.

**Motivo**: o pedido precisa do nome e do tipo (FR-002). O tipo do registro é a fonte
de verdade do editor. O nome sai do Python porque só ele sabe qual `leia` está rodando
(um `leia` dentro de um laço é o mesmo bloco a cada volta). Ler o `main.py` depende da
forma do código gerado, que não é interface pública. Por isso a falha cai num pedido
genérico, que continua funcionando, e o caso de aceitação dos quatro tipos detecta uma
mudança do Core (R-10).

**Lacuna do Core**: a interface pública do Core não informa qual variável um `leia` vai
preencher. O editor precisa dessa informação para o pedido (FR-002) e hoje a deduz da
forma do `output/main.py`, que não é contrato. Pelo princípio I, o contorno é o adapter
do lado do editor descrito acima (isolado em `ponte-python.js`, testado na aceitação
dos quatro tipos e com o pedido genérico como queda), e a lacuna vira issue em
`meuPia/core`: [meuPia/core#18](https://github.com/meuPia/core/issues/18).

**Texto da issue** (T031; a dupla abre em `meuPia/core` e põe o link aqui, **antes do
PR** desta spec):

> **Título**: Expor qual variável o `leia` vai preencher
>
> **Versão**: `meupia-core` 1.4.1 (PyPI), rodando no Pyodide 0.25.0.
>
> **Contexto**: um editor que executa o programa e pede a entrada ao usuário (meuPiá
> Blocos, entrada do `leia` durante a execução) precisa mostrar o nome da variável que
> vai receber o valor, por exemplo "Digite o valor de nome (cadeia)".
>
> **Passos**: compilar o programa
>
> ```text
> algoritmo "T"
> var
>     nome: cadeia
> inicio
>     leia(nome)
> fim_algoritmo
> ```
>
> **Obtido**: o Python gerado chama `nome = _S(input())`, sem argumento. Quem executa
> o programa não tem como saber, pela interface pública, qual variável o `input()` está
> lendo.
>
> **Sugestão**: o código gerado passar a informação ao `input()`, por exemplo no
> `prompt` (`input("nome")`, ou um formato combinado como `input("leia:nome:cadeia")`),
> ou chamar uma função `_leia("nome", "cadeia")` substituível pelo ambiente de execução.
> No terminal, um `prompt` vazio pode ser mantido como opção do compilador.
>
> **Contorno no meuPiá Blocos**: o editor troca o `input` no ambiente do `exec` e lê o
> nome na linha do `output/main.py` que chamou o `input()` (`src/core/ponte-python.js`).
> Se a linha não tiver o formato esperado, o campo pede "Digite um valor".

**Link da issue**: [meuPia/core#18](https://github.com/meuPia/core/issues/18).

**Alternativas consideradas**: deduzir o tipo pela linha do Python (`int(`, `float(`)
(rejeitada: duplicaria o registro de variáveis e dependeria ainda mais do formato
gerado); numerar os `leia` no Portugol (rejeitada: o código executado é o do painel,
FR-001 da 009, e um `leia` num laço repete); usar o `setStdin` do Pyodide (rejeitada:
o callback não sabe qual linha chamou e acrescenta a quebra de linha).

---

## R-04. Protocolo e responsabilidades

**Adapter** (`src/core/executor-core.js`):

- `compilarEExecutar(motor, codigo, entrada = [], { aoEscrever, interativo = false })`.
  Com `interativo` e a entrada esgotada, devolve
  `{ status: 'aguardando_entrada', saida, erro: null, pedido: { variavel } }`.
- `continuarExecucao(motor, entrada, { aoEscrever, interativo })`: executa de novo o
  `output/main.py` já compilado, sem recompilar. Mesmo formato de resultado.
- Sem `interativo`, o comportamento é o da 009.

**Serviço do worker** (`src/execucao/servico.js`): guarda a execução pendente
`{ id, entrada, enviado }`. Recebe `executar` com `interativo`, posta `pedido_entrada`
e, a cada `entrada`, chama `continuarExecucao`.

**Mensagens novas**:

| Direção | Mensagem | Quando |
| --- | --- | --- |
| Página → worker | `{ tipo: 'executar', id, codigo, entrada, interativo }` | `interativo` é novo; ausente = `false`. |
| Worker → página | `{ tipo: 'pedido_entrada', id, variavel }` | O programa chegou num `leia` sem valor. Os lotes de saída pendentes vão antes. |
| Página → worker | `{ tipo: 'entrada', id, valor }` | O estudante confirmou. Valor de outro `id` é ignorado. |

**Executor** (`src/execucao/executor.js`): `executar(codigo, { …, aoPedirEntrada })`.
Com `aoPedirEntrada`, envia `interativo: true`. Em `pedido_entrada` do `id` atual, chama
`aoPedirEntrada({ variavel })` e, quando a promessa resolve e a execução ainda é a
mesma, posta `entrada`. O `parar()` não muda.

**Controlador** (`src/execucao/controlador.js`): monta o pedido (R-06), chama
`saida.pedirEntrada(pedido)`, escreve o valor confirmado com o tipo `entrada` e o
devolve ao executor.

**Motivo**: mesma divisão da 009. O adapter sabe do Python, o serviço sabe do worker,
o executor sabe das mensagens e o controlador sabe da Saída. Cada parte é testável com
falsos (R-10).

---

## R-05. Saída na reexecução

**Decisão**:

- O serviço guarda o texto já enviado à página (`enviado`). Numa nova rodada, a escrita
  passa por um filtro: enquanto o texto produzido não passar do tamanho de `enviado`, ele
  é **comparado** com o trecho correspondente e descartado. Só o que vem depois é
  enviado (em lotes de 50 ms, regra da 009).
- Se a comparação falhar, a rodada termina como `erro_execucao` com a mensagem genérica
  e o detalhe "A reexecução do programa produziu uma saída diferente da anterior." Isso
  só acontece se a premissa do R-02 for quebrada.
- Antes de postar `pedido_entrada`, o serviço envia o lote pendente. O `escreva` do Core
  sempre termina a linha (R-02 da 003), então a última linha antes do pedido já está
  completa na Saída quando o campo aparece.

**Motivo**: o estudante vê cada linha uma vez só, na ordem (cenário 3 da História 1). A
comparação transforma a premissa de determinismo numa verificação, sem custo relevante.

**Alternativas consideradas**: só contar caracteres (rejeitada: uma divergência passaria
em silêncio); limpar a Saída e reescrever tudo a cada rodada (rejeitada: a Saída
"piscaria", e o valor digitado sumiria e voltaria).

---

## R-06. Textos do pedido (FR-002, FR-005)

**Decisão**: módulo puro `src/execucao/entrada.js`, com
`criarPedidoEntrada(variavel, variaveis) → { rotulo, dica }`:

| Tipo | `rotulo` | `dica` |
| --- | --- | --- |
| `cadeia` | `Digite o valor de nome (cadeia)` | `null` |
| `inteiro` | `Digite o valor de idade (inteiro)` | `Número sem casas decimais, por exemplo 15.` |
| `real` | `Digite o valor de altura (real)` | `Use ponto para separar as casas decimais, por exemplo 1.72.` |
| `logico` | `Digite o valor de ok (lógico)` | `Digite verdadeiro ou falso. Só "verdadeiro" vira verdadeiro.` |
| desconhecido | `Digite um valor` | `null` |

O tipo aparece como a palavra do Portugol (princípio V), com o acento de "lógico" na
interface, como o menu de tipos da 002. O texto do botão (`Confirmar`) fica no mesmo
módulo, junto com os outros textos da execução.

**Motivo**: o rótulo segue o exemplo da spec (cenário 1 da História 1). As dicas são as
do FR-005. A do lógico repete a regra do R-02 da 003 e da dica do bloco. Textos no núcleo
seguem a exceção que a 009 já registrou no contrato da Saída da 001.

---

## R-07. Real digitado com vírgula (P-2)

**Fatos**: `float("1,72")` → `ValueError: could not convert string to float: '1,72'`,
traduzido pela 008/009 como "O valor digitado não é um número." (confirmado de novo em
2026-11-16 com `leia-quatro-tipos` e `1,5`).

**Decisão**:

1. **O editor não troca a vírgula pelo ponto.** O valor vai ao programa exatamente como
   digitado (FR-004). Converter só aqui faria o mesmo programa se comportar diferente no
   editor e no meuPiá Lab (princípio I), e o `leia` de cadeia precisa receber a vírgula.
2. **Prevenção**: a dica do `real` lembra o ponto (R-06).
3. **Erro mais claro**: `traduzirErroExecucao` reconhece `ValueError` de `float()` com
   vírgula no valor (`could not convert string to float: '…,…'`) e acrescenta à
   mensagem: "O valor digitado não é um número. Use ponto para separar as casas
   decimais, por exemplo 1.72." Sem vírgula, a mensagem continua a da 009.
4. **Issue no Core**: não. A recusa da vírgula é o comportamento do Portugol do Core,
   não uma lacuna da interface pública. O comportamento continua registrado nas
   Premissas da spec.

**Motivo**: a spec manda entregar o valor como digitado e avisar pela dica (casos de
borda). O complemento da mensagem cobre quem não leu a dica, sem esconder a regra do
Portugol.

**Alternativas consideradas**: trocar `,` por `.` antes de entregar (rejeitada: FR-004 e
divergência com o Lab); recusar no próprio campo (rejeitada: o campo não sabe se a
variável é real ou cadeia sem regra extra, e o erro do Core é o comportamento real que
o estudante vai encontrar no Portugol escrito).

---

## R-08. Campo de entrada no painel Saída (FR-002, FR-003, SC-002)

**Decisão**:

- `painel-saida.js` ganha `pedirEntrada({ rotulo, dica, confirmar }) → Promise<string>` e
  `cancelarEntrada()`. O campo é um `<form>` no fim da Saída, com `<label>` (rótulo),
  `<input type="text">`, a dica (`aria-describedby`) e o botão `Confirmar`. Enter
  confirma (submit do form). O foco vai para o campo ao aparecer.
- Ao confirmar, o form some e a promessa resolve com o valor do `<input>`, sem `trim`.
  O controlador escreve o valor como linha do tipo `entrada` (`saida-linha--entrada`),
  com destaque visual próprio (cor e marcador `› ` por CSS, fora do texto copiado).
- Sem `window.prompt` nem caixa de diálogo (SC-002).
- `cancelarEntrada()` remove o campo e deixa a promessa pendente sem resolver. O
  controlador chama `cancelarEntrada()` no fim de toda execução, inclusive no Parar.
- O estado da execução continua `executando` enquanto o campo está aberto: Executar
  desabilitado e Parar habilitado (R-10 da 009 sem mudança).

**Motivo**: um `form` dá Enter e botão sem código extra e é acessível. Manter o estado
evita mexer na barra e nos testes da 009.

---

## R-09. Parar com o campo aberto (História 2)

**Decisão**: nada novo no executor. `parar()` já faz `terminate()` e resolve a execução
como `interrompido`. O controlador escreve "Execução interrompida pelo usuário" (texto da
009) e fecha o campo. Um `entrada` que chegue depois é de um `id` antigo e é ignorado.
O botão Novo usa `controlador.parar()` e herda esse comportamento.

---

## R-10. Testes

**Unidade** (sem Pyodide):

- `entrada.js`: rótulo e dica dos quatro tipos, variável desconhecida, `null`.
- `executor-core.js` (tradução): vírgula num `float` → mensagem com o complemento;
  sem vírgula → mensagem da 009.
- `servico.js` com motor falso: `interativo` posta `pedido_entrada` depois do lote
  pendente; `entrada` chama `continuarExecucao` com a lista acumulada; a saída repetida
  não é reenviada; divergência vira `erro_execucao`; `entrada` de outro `id` é ignorada.
- `executor.js` com `Worker` falso: `aoPedirEntrada` liga `interativo`; a resposta vira
  `entrada`; resposta depois do Parar não é enviada.
- `controlador.js` com Saída falsa: rótulo e dica do pedido; valor escrito como
  `entrada`; três pedidos em ordem; Parar com o campo aberto fecha o campo e escreve a
  mensagem de interrompido.

**Aceitação** (Core 1.4.1 real):

- `adapter-core.test.js`: `interativo` devolve `aguardando_entrada` com `variavel` nos
  quatro tipos e dentro de um `enquanto`; `continuarExecucao` sem recompilar; valor
  vazio; `1,72` em real → mensagem com o complemento; `1.72` → ok.
- `executar.test.js` (worker real em `worker_threads`):
  - História 1, teste independente: `leia(nome)` + `escreva("Oi, ", nome)`, "Ana" →
    `Oi, Ana`;
  - três `leia` seguidos → três pedidos, um de cada vez, na ordem, com os nomes certos;
  - `leia` num `enquanto` (texto Portugol, porque os blocos de repetição são da 005);
  - Parar com um pedido aberto → `interrompido`, e a execução seguinte funciona;
  - **SC-001**: todo caso de aceitação com `entrada` (hoje `leia-quatro-tipos` e
    `leia-logico-falso`) é executado em modo interativo, com as entradas fornecidas uma
    a uma por `aoPedirEntrada`, e a Saída é igual à `saidaEsperada`. Os casos sem `leia`
    continuam iguais.
- Caso novo `leia-real-virgula.json` (`statusEsperado: "erro_execucao"`): documenta P-2.

**Navegador** (quickstart): campo na Saída, Enter e botão, foco, diferença visual, Parar
com o campo aberto, Novo durante a espera.

---

## R-11. Dependências

Nenhuma dependência nova (princípio VI). `re` e `sys` são da biblioteca padrão do Python
do Pyodide. A versão do Core continua só em `src/config.js`.

---

## R-12. Atualizações em documentos de outras specs

Feitas numa task `docs` desta spec:

- 009: `research.md`, R-14, linha da 010 → resolvida pelo R-02 desta spec;
  `plan.md`, "Pendências para outras specs", o mesmo; `contracts/executar.md`, protocolo
  → aponta para as mensagens novas ([contracts/entrada.md](contracts/entrada.md)).
- 003: `plan.md`, "Pendências para outras specs", linha da 010 → resolvida (R-07, R-08);
  `research.md`, R-02, linhas "Entrada esgotada" e `leia-quatro-tipos` → apontam para esta
  spec.
- 001: `contracts/painel-saida.md` → `pedirEntrada`, `cancelarEntrada` e o tipo de linha
  `entrada`.
- 005: nas Premissas, como regra de usuário: um `leia` dentro de um laço pede o valor a
  cada volta (spec 010); conferido com os blocos de repetição.
