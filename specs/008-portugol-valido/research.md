# Pesquisa (Fase 0): Portugol válido para o Core

Decisões que resolvem o contexto técnico do [plan.md](plan.md). As evidências sobre o
Core vêm da leitura do pacote `meupia-core` 1.4.1 baixado do PyPI (fora do
repositório, sem copiar nenhum arquivo) e de um spike que rodou o Core no Node pelo
Pyodide. Nada ficou como "NEEDS CLARIFICATION".

---

## R-01. Interface pública do Core e modelo de execução

**Decisão**: usar exatamente o fluxo do meuPiá Lab (`src/engine/wasm.js`):

1. Gravar o Portugol em `main.por` no sistema de arquivos virtual do Pyodide.
2. Chamar `meuPia.compiler.main("main.por", "output")` com `sys.stdout` redirecionado
   para um `io.StringIO`. O retorno `0` indica sucesso, e `1` (ou ausência de
   `output/main.py`) indica erro de compilação.
3. Em caso de sucesso, ler `output/main.py` e rodar `exec(codigo, {"__name__": "__main__"})`,
   com o `stdout` do programa capturado e o `stdin` alimentado pela entrada.

**Achados**:
- `main()` imprime o progresso ("Compilando…", "Scanning line…") e, no erro, a linha
  `[COMPILATION ERROR]:\n\t<mensagem>`. As mensagens já vêm em pt-BR, no formato
  `Erro <etapa> na linha L, coluna C: <descrição>`, com etapa `léxico`, `sintático` ou
  `semântico`.
- O código Python gerado tem um `main()` e o guarda `if __name__ == '__main__'`; por
  isso o `exec` precisa de `__name__ = "__main__"`.
- A saída de `escreva` é `print(''.join(...))`: uma linha por `escreva`, valores
  colados, lógicos como `verdadeiro`/`falso`.
- `leia` vira `int(input())`, `float(input())`, `input().strip().lower() == 'verdadeiro'`
  ou `_S(input())`, conforme o tipo declarado.

**Motivo**: é a interface pública citada na constitution (princípio I) e o mesmo
caminho do Lab. Isso garante que o Portugol colado no Lab rode igual.

**Alternativas consideradas**: importar `lexical_analyzer`/`syntax_analyzer`
diretamente para validar sem gerar arquivo. Rejeitada: são módulos internos, não a
interface pública, e mudariam sem aviso.

---

## R-02. Sintaxe que o Core 1.4.1 aceita (referência para o gerador)

Lido no lexer e no parser do pacote e confirmado no spike:

| Tema | Comportamento do Core 1.4.1 | Consequência para o gerador |
| --- | --- | --- |
| Estrutura | `algoritmo STRING` → `var` opcional → `inicio` → comandos → `fim_algoritmo`; nada depois. | Estrutura fixa do contrato. Programa vazio é aceito (spike ✅). |
| Declaração | `nome1, nome2: tipo`. Tipos: `inteiro`, `real`, `cadeia` são palavras-chave; `logico` só vale **na posição de tipo**. | Uma linha por variável: `    nome: tipo`. `logico` é aceito (spike ✅). |
| Palavras-chave | Reconhecidas **sem diferenciar maiúsculas** (`SE` = `se`); aceitam formas com e sem acento (`senão`/`senao`). | Gerar sempre a forma minúscula sem acento: `se`, `entao`, `senao`, `faca`, `ate`, `nao`. |
| Igualdade | `=` sozinho vira o token de atribuição, mas dentro de expressão é tratado como comparação; `==` também funciona. | Gerar `=` (a palavra do Portugol que o estudante vê); spike ✅. |
| Diferente | `<>` (e `!=`). | Gerar `<>`. |
| Resto | `%` e `mod`. | Gerar `%`. |
| Precedência | `ou` < `e` < `nao` < relacional (não associativo) < `+ -` < `* / %` < `-` unário < primário. | A 006 parenteseia conforme essa escala. `a < b < c` é erro, então uma comparação dentro de outra sempre vai entre parênteses. |
| Tradução | A expressão vira Python token a token, sem reordenar. | O sentido no Python é o sentido do texto; os parênteses do gerador bastam. |
| Divisão | `/` vira o `/` do Python (divisão real: `7 / 2` = `3.5`). | As saídas esperadas dos casos de aceitação seguem isso. |
| Números | Só dígitos com um ponto opcional (`3`, `3.14`); sem expoente, sem vírgula. | A 006 formata números sem notação científica e troca vírgula por ponto. |
| Textos | Entre aspas duplas; `\"` não fecha o texto; o conteúdo vira literal Python. | Escapar `\` → `\\` e `"` → `\"`. Spike: `"a\"b\\c"` imprime `a"b\c` ✅. |
| Comentários | `//` até o fim da linha (fora de textos). | O gerador não emite comentários. |
| Blocos vazios | `se … entao fim_se` e `enquanto … faca fim_enquanto` vazios são aceitos (spike ✅). | Sem comando de preenchimento. |
| `para` | `para v de a ate b [passo p] [faca] … fim_para`; inclusivo nos dois sentidos; passo 0 é erro de execução. | Gerar sempre `faca`; a 005 bloqueia passo fixo 0 antes. |
| Nomes | Identificadores viram nomes Python **sem renomear**. | Ver R-10: a 002 precisa reservar palavras do Python e nomes do runtime. |

---

## R-03. Como os testes de aceitação executam o Core real

**Decisão**: **Pyodide no Node**, com o pacote npm `pyodide` na **mesma versão do
Lab (0.25.0)**, dentro do Vitest. O teste instala `meupia-core` via micropip com a
versão de `src/config.js` e chama o mesmo adapter (`src/core/executor-core.js` +
`ponte-python.js`) que o navegador usa.

**Evidência (spike, 2026-11-08, Node 24.21, Windows)**: `pyodide@0.25.0` +
`micropip.install("meupia-core==1.4.1")` carregou em 4,5 s. Três programas
compilaram e rodaram:

- programa vazio → saída vazia;
- programa com os quatro tipos, `%`, `/`, `nao (n = 1) ou verdadeiro`, texto com
  `\"` e `\\`, `se/senao` e `para` → `um 3.5 verdadeiro a"b\c`, `2`, `4`, `6`;
- `se` e `enquanto` vazios → aceito.

**Motivo**:
- Testa o adapter de verdade, não só o Core. A ponte Python é a mesma string nos dois
  ambientes, então um teste verde no Node prova o caminho do navegador.
- Mesmo interpretador (CPython 3.11 do Pyodide 0.25) que o estudante usa no
  navegador; diferenças de `str(float)` ou de Unicode não aparecem só em produção.
- Não exige Python instalado na máquina nem no CI, só Node.

**Alternativas consideradas**:
- *Python nativo + `pip install meupia-core==1.4.1` chamado por subprocess*: rápido e
  sem rede depois do primeiro `pip`, mas exige Python no ambiente, usa outro
  interpretador e não exercita o adapter JS. Rejeitada.
- *Playwright rodando a página real*: cobre a UI, mas é lento, pesado e
  desnecessário para RNF-07. Rejeitada para esta feature.
- *Pyodide mais novo (0.27+/0.28)*: provavelmente funciona, mas o Lab usa 0.25.0 e a
  paridade com o Lab é uma premissa da spec. Fica 0.25.0 até haver motivo para mudar.

---

## R-04. Rede, cache e tempo da suíte de aceitação

**Decisão**:
- Um único arquivo de teste de aceitação, com um único motor Pyodide criado no
  `beforeAll` e reaproveitado por todos os casos. O projeto `aceitacao` do Vitest
  roda em um único worker (`pool: 'forks'`, `singleFork`), com `testTimeout` de 120 s
  no `beforeAll`.
- Entre um caso e outro, o adapter limpa `output/` e `main.por`, e cada `exec` usa
  um dicionário de globais novo. Assim um caso não vaza estado para o seguinte.
- O Pyodide guarda em `node_modules/pyodide` os wheels do micropip baixados do CDN.
  O `meupia-core` vem do PyPI a cada execução da suíte; é um arquivo de 30 KB.
- `npm test` roda as duas suítes. `npm run test:unidade` roda só a rápida, que não
  usa rede.

**Motivo**: o custo fixo (~5 s) acontece uma vez só. Sem rede a suíte de aceitação
falha com uma mensagem clara ("não foi possível baixar o meupia-core"), nunca com
um falso verde.

**Alternativa considerada**: versionar o wheel do Core no repositório para rodar
offline. Rejeitada: seria copiar um artefato do meuPiá para cá (princípio I).

---

## R-05. Gerador sobre a serialização JSON, sem depender do Blockly

**Decisão**: o gerador recebe o **projeto serializado** e percorre o JSON de
`Blockly.serialization.workspaces.save()` (`blocks.blocks[]`, com `type`, `id`,
`fields`, `inputs.{NOME}.block`, `next.block`). Não usa a classe
`Blockly.CodeGenerator`. Cada tipo de bloco registra uma função
`gerar(bloco, ctx)` no registro (ver [contracts/registro-blocos.md](contracts/registro-blocos.md)).

**Motivo**:
- A constitution pede função pura "workspace serializado → texto" (princípio II).
- O arquivo salvo (011) contém exatamente essa serialização, então os casos de
  aceitação usam o mesmo JSON que o estudante salva, sem precisar de workspace.
- Testes de unidade rodam em Node puro, sem jsdom e sem instanciar o Blockly.
- O mesmo caminho serve à geração em tempo real (007): `save()` e depois
  `gerarPortugol()`; com 100 blocos isso custa poucos milissegundos.

**Alternativa considerada**: o `CodeGenerator` do Blockly (`forBlock[...]`). Ele
exige um workspace vivo, mistura geração com estado do Blockly e dificulta o
determinismo e os testes sem navegador. Rejeitada.

---

## R-06. Marcador da parte ausente e texto dos avisos

**Decisão**:
- O marcador no Portugol é `???` no lugar exato da parte que falta (ex.:
  `se ??? entao`, `escreva(???)`, `leia(???)`).
- O aviso tem o formato `Falta <parte> do bloco <nome do bloco>`, com a parte
  já acompanhada do artigo: "Falta a condição do bloco se", "Falta o valor do bloco
  escreva", "Falta a variável do bloco leia". Cada bloco declara o rótulo de cada
  encaixe obrigatório (`{ parte: 'a condição' }`), e o mecanismo monta a frase.
- A ordem dos avisos é a ordem de visita do gerador (de cima para baixo e de dentro
  para fora, na ordem dos encaixes), que é a ordem em que aparecem no texto.
- Blocos soltos (fora do `programa`) não são visitados, portanto não geram aviso
  (coerente com a spec 007: blocos soltos não entram no Portugol).

**Motivo**: `???` é visível, curto, cabe em fonte monoespaçada e não é Portugol
válido, o que torna óbvio que o programa não está pronto. Mesmo que algo escapasse
do bloqueio, o Core rejeitaria o texto (caractere desconhecido `?`), em vez de rodar
outra coisa. Montar a frase a partir do rótulo mantém as mensagens consistentes nas
specs 003–006.

**Alternativas consideradas**:
- Valor neutro (`0`, `falso`) no lugar do encaixe vazio: a constitution permite,
  mas esconderia o problema e a spec exige marcador visível. Rejeitada.
- Marcadores com Unicode (`«condição»`): mais bonitos, porém mais difíceis de
  digitar e de encontrar no texto. Rejeitada.

---

## R-07. Dependências e versões

| Pacote | Uso | Justificativa (princípio VI) | Versão |
| --- | --- | --- | --- |
| `blockly` | Editor de blocos e serialização JSON | Stack registrada na constitution (D-02). | Última estável da série 12 no momento da T001, travada no `package-lock.json`. |
| `pyodide` | Python/WASM no navegador e no Node | Execução do Core (D-03); o mesmo pacote serve aos testes de aceitação. | `0.25.0` exato (paridade com o Lab, R-03). |
| `vite` (dev) | Servidor de desenvolvimento e build estático | Stack registrada. | Última estável no momento da T001. |
| `vitest` (dev) | Testes de unidade e de aceitação | Stack registrada. | Última estável, mesma série do coverage. |
| `@vitest/coverage-v8` (dev) | Cobertura v8 | Stack registrada (princípio IV). | Mesma versão do `vitest`. |

`meupia-core` não entra no `package.json`: é instalado pelo micropip com
`MEUPIA_CORE_VERSAO` de `src/config.js`, o único lugar com o número da versão.

No navegador, o Pyodide é carregado com `indexURL` apontando para
`https://cdn.jsdelivr.net/pyodide/v${version}/full/`, onde `version` é exportado
pelo próprio pacote `pyodide`. Assim a versão do Pyodide também tem um ponto só, o
`package.json`.

**Sem jsdom**: o gerador não precisa de DOM. Os testes das definições de bloco (que
entram na cobertura) usam o Blockly headless no Node, suportado pelo próprio pacote
`blockly`.

---

## R-08. Cobertura, relatório versionado e linha do README

**Decisão**:
- Vitest `coverage.provider: 'v8'`, com `include` em `src/portugol/**`,
  `src/blocos/**`, `src/projeto/**` e `src/core/**`. A exclusão declarada fica em
  `src/ui/**`, `src/main.js` e `src/core/motor-navegador.js` (este depende do CDN e
  do `window`).
- `thresholds: { lines: 80, branches: 80 }`. Abaixo disso a suíte falha (princípio
  IV: entrega abaixo de 80% não entra na `main`).
- Reporters `text`, `html` e `json-summary`, gravados em `cobertura/`, que é
  versionado. O `coverage/` padrão não é usado.
- `scripts/atualizar-readme.mjs` lê `cobertura/coverage-summary.json` e o relatório
  JSON do Vitest (número de testes) e reescreve a linha do topo do README no formato
  `**Testes:** N · **Cobertura:** X%`. O script `npm run cobertura` roda os testes
  e em seguida esse script.

**Motivo**: atende RNF-04 com um comando só e sem passo manual sujeito a esquecimento.

---

## R-09. Lacunas no Core: issues e adapters

| Lacuna | Adapter do lado do editor | Issue em `meuPia/core` |
| --- | --- | --- |
| Não há função pública que compile um **texto** e devolva erro estruturado; `main()` exige arquivo, imprime o progresso e o erro no stdout. | `ponte-python.js` grava `main.por`, captura o stdout e extrai a mensagem depois de `[COMPILATION ERROR]:` (linha, coluna, etapa) com uma expressão regular testada. | Abrir: "Expor `compilar(texto) -> (python, erro)` sem efeitos em arquivo". |
| A descrição do token de atribuição nas mensagens do parser mostra `"="`, o que confunde quem escreveu `<-`. | Nenhum (o editor nunca gera texto inválido). | Registrar só como observação, se a turma achar relevante. |

As issues são abertas pela dupla (task de documentação); o editor não depende de elas
serem resolvidas.

---

## R-10. Achados que alimentam outras specs

Registrados aqui para os plans seguintes não redescobrirem:

- **002 (nomes de variável)**: como os nomes viram identificadores Python sem
  renomear, além das palavras do Portugol a lista de nomes recusados precisa incluir:
  - palavras-chave do Core: `string`, `float`, `dicionario`, `filaprioridade`, `mod`,
    `usar`, `funcao`, `retorne`, `fim_funcao`, `continue`, `interrompa`, `classe`,
    `metodo`, `novo`, `fim_classe`, `lista`, `vetor`, `logico`;
  - nativos do Core: `verdadeiro`, `falso`, `pi`, `tamanho`, `raiz`, `potencia`,
    `seno`, `cosseno`, `tangente`, `teto`, `piso`, `absoluto`;
  - palavras-chave do Python (`if`, `in`, `is`, `not`, `and`, `def`, `class`, `None`,
    `True`, `False`…);
  - nomes que o runtime gerado usa no escopo global: `main`, `sys`, `math`, `heapq`,
    `deque`, `print`, `input`, `int`, `float`, `str`, `len`, `range`, `abs`, `list`,
    `dict`, `FilaPrioridade`. Exemplo: uma variável `print` quebraria o `escreva`.
  A comparação é sem diferenciar maiúsculas, como a da spec.
- **002 (seção var)**: uma linha por variável, agrupada por tipo (inteiro, real,
  cadeia, logico) e, dentro do tipo, na ordem de criação.
- **006 (números)**: formatar sem notação científica (`String(1e21)` daria `1e+21`,
  que o lexer não aceita); vírgula vira ponto; negativo literal sai como `-` unário.
- **006 (operadores)**: `-(-x)` com parênteses; `nao` tem precedência menor que as
  comparações (`nao a > b` significa `nao (a > b)`).
- **003/006 (saída)**: reais são impressos pelo `str()` do Python (`3.5`,
  `0.30000000000000004`, `2.0`); as saídas esperadas dos casos seguem isso.
- **009/010 (stdin)**: o `input()` do programa lê do `stdin` do Pyodide. No Node os
  testes usam `pyodide.setStdin({ stdin })` com a lista de entradas do caso. No
  navegador a 009/010 decide entre worker com `SharedArrayBuffer` e `window.prompt`
  (o Lab usa `prompt`).

---

## R-11. Saneamento do nome do programa

**Decisão**: `sanearNomePrograma(nome)`:
1. `String(nome ?? '')`;
2. remove `"`, `\` e caracteres de controle (incluindo quebras de linha, que
   quebrariam a linha do `algoritmo`);
3. tira espaços das pontas;
4. corta em 40 caracteres (contando pontos de código, para não partir um caractere
   acentuado) e tira de novo os espaços da ponta;
5. se ficar vazio, usa `MeuPrograma`.

**Motivo**: FR-007 e os casos de borda. A interface (spec 001) também limita o
campo, mas o gerador se protege sozinho porque um JSON carregado (012) pode trazer
qualquer coisa.

---

## R-12. Formato final do texto

**Decisão**: linhas separadas por `\n` (LF), sem espaços no fim das linhas e com o
texto terminando em `\n` depois de `fim_algoritmo`. Linha em branco depois de
`algoritmo "…"` e depois do bloco `var` (quando existe). Indentação de 4 espaços por
nível; as declarações e os comandos dentro de `inicio` ficam no nível 1.

**Motivo**: segue os cenários 1 e 2 da História 1. Com LF fixo, o texto é igual
caractere por caractere em qualquer sistema (FR-004); o Core lê o arquivo com
`readlines()`, então LF funciona no Windows também.

---

## R-13. Bloco raiz "programa"

**Decisão**: o workspace tem um bloco raiz `programa` (chapéu, não apagável, um só
por projeto), com o rótulo "programa" e uma área de comandos `COMANDOS`. Só a cadeia
dentro de `COMANDOS` entra em `inicio … fim_algoritmo`. Se o JSON não tiver o bloco
`programa` (arquivo antigo ou projeto vazio), o gerador trata como programa sem
comandos. Ter mais de um `programa` é um erro de formato tratado pela 012; o gerador
usa o primeiro, em ordem de serialização, para continuar determinístico.

**Motivo**: a spec 007 exige distinguir blocos encaixados de blocos soltos, e um
ponto de partida explícito é a forma mais simples de fazer isso no Blockly.
