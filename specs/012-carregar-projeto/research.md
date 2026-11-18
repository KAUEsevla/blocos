# Pesquisa (Fase 0): Carregar projeto em JSON

Spec: [spec.md](spec.md) (RF-12). Pedidos do plan: (1) as Premissas sobre o que a 011 deixou
pronto; (2) o encaixe inválido da 006 (`BadConnectionCheck`); (3) a decisão do
[specs/README.md](../README.md): validar o arquivo inteiro antes de mexer no projeto aberto;
(4) confirmação com alterações não salvas, como o Novo (001, FR-007); (5) Portugol gerado
assim que os blocos aparecem (007).

## R-01. Inventário: o que já existe na `main`

| Peça | Onde | Uso na 012 |
| --- | --- | --- |
| `FORMATO`, `VERSAO_FORMATO`, `TIPOS_VARIAVEL`, `montarArquivo`, `textoArquivo` | `src/projeto/formato.js` | a leitura (`lerArquivo`) entra no mesmo módulo (Premissas) |
| `assinaturaProjeto`, `haAlteracoes` | `src/projeto/alteracoes.js` | sem mudança: carregar marca `referencia` |
| `blocosComVariaveis`, `variaveisDoMapa` | `src/projeto/variaveis.js` | o caminho de carga do Novo (`recarregarBlocos`) |
| `validarNomeVariavel` | `src/projeto/nome-variavel.js` | já comentado como "usado pela 012 (validar o arquivo carregado)" |
| `registroPadrao` (`tiposRegistrados`, `obter`) | `src/blocos/registro.js` | blocos conhecidos, encaixes e campos de cada tipo |
| `encaixesIncompativeis`, `checkEfetivo` | `src/blocos/tipos.js` | encaixe inválido antes da carga (006, contracts/tipos-encaixe.md) |
| `MAX_VALORES` (10) | `src/blocos/entrada-saida.js` | limite do `extraState.valores` do escreva |
| `temSenao` (`extraState?.senao === true`) | `src/blocos/decisao.js` | ausente = senão desligado (Premissas) |
| `recarregarBlocos` (load + `clearUndo`) | `src/ui/workspace.js` | troca o projeto aberto, como no Novo |
| `novoProjeto()` | `src/main.js` | modelo da sequência do Carregar |
| `confirmar` | `src/ui/confirmacao.js` | confirmação de descarte (pt-BR) |
| `carregarNoWorkspace`, `projetoDoWorkspace` | `tests/auxiliares/salvar-blockly.js` | caminho headless para os testes |
| `#botao-carregar` | `index.html` | hoje `disabled`, `title="Disponível em breve"` |

## R-02. O que a 011 garante e a 012 usa (pedido 1)

- **Leitura em `formato.js`**: `lerArquivo(texto)` fica ao lado de `montarArquivo` e
  `textoArquivo`; o formato é definido num lugar só.
- **Se sem `extraState`** = senão desligado. A 011 grava o se sem senão **sem** a chave (o
  mutador devolve `null`). A leitura NÃO exige `extraState`: ausente vale `senao: false`. Só
  `extraState.senao` diferente de `true`/`false` é dado inválido. Um `inputs.SENAO` com o
  senão desligado também é inválido (o Blockly lançaria `MissingConnection`, R-05).
- **Nome como digitado**: `nome` é qualquer `string` (pode ser vazia, ter espaços, acentos ou
  aspas). A leitura não saneia nem apara; o campo recebe o texto exato por `definirNome`, e o
  gerador continua saneando no `algoritmo "…"`. Só `nome` que não é `string` é inválido.
- **Referência de "sem alterações"**: depois da carga, `referencia =
  assinaturaProjeto(projetoAtual())`, lida do workspace já carregado (como o Novo, 001 R-05),
  e `mostrarAlteracoes(false)`. O indicador e o `beforeunload` da 011 usam a mesma
  `referencia`; nada mais muda neles. Como a 011 provou que salvar → ler tem a mesma
  assinatura, carregar um arquivo do editor deixa o projeto "sem alterações".

**Decisão**: tudo isso fica explícito no contrato
[carregar.md](contracts/carregar.md) e é conferido por teste (ida e volta e se sem
`extraState`).

## R-03. Validar o arquivo inteiro antes de mexer no projeto (pedido 3; FR-002, FR-004)

Sondagem headless com o Blockly 12.5.1 e o verificador `meupia` (registrada aqui; feita com
o `carregarNoWorkspace` dos testes):

| Arquivo | O que o `workspaces.load` faz |
| --- | --- |
| tipo de bloco desconhecido (`xyz`) | lança `TypeError: Invalid block definition for type: xyz` |
| lógico encaixado em `recebe` de variável inteira | lança `BadConnectionCheck` (006) |
| `inputs` com encaixe que o bloco não tem | lança `MissingConnection` |
| `fields.VAR.id` de variável que não existe | **aceita**: cria uma variável sem tipo e deixa o campo vazio |
| `escreva` com `extraState.valores: 99` | **aceita**: reduz para 10 |
| nenhum bloco `programa` | **aceita** |
| dois blocos com o mesmo `id` | **aceita**: troca o `id` do segundo |
| `numero` com `NUM: "abc"` | **aceita**: o validador troca para `"0"` |

Dois problemas: (a) quando o load lança, o workspace já foi limpo e ficou meio carregado;
(b) vários erros passam calados e o projeto aberto seria trocado por outro diferente do
arquivo. Os dois violam o FR-004 e a decisão do README.

**Decisão**: carregar em **três etapas**, e só a última toca o projeto aberto:

1. **Leitura pura** (`lerArquivo`, em `formato.js`): JSON, identificação, versão, nome,
   variáveis e a forma de `blocos` (R-04).
2. **Validação pura dos blocos** (`validarBlocos`, em `src/projeto/carregar.js`): contra o
   `registroPadrao` e `encaixesIncompativeis` (R-05). Cobre todos os casos da tabela.
3. **Carga de ensaio** num workspace headless descartável (`ensaiarCarga`, em
   `src/ui/workspace.js`), com o mesmo verificador: rede de segurança para qualquer erro do
   Blockly que a validação pura não previu (R-06). Só depois dela vem o `recarregarBlocos`
   no workspace da tela.

**Alternativas rejeitadas**: (i) só o `try/catch` em volta do load real: deixa o workspace
meio carregado e não pega os erros calados; (ii) guardar o projeto aberto e restaurar em caso
de erro: restaurar perde a pilha de desfazer e depende de o load do projeto antigo funcionar;
(iii) comparar a assinatura do ensaio com a do arquivo e recusar se mudou: recusaria arquivos
escritos à mão que só omitem um campo com valor padrão e não diz ao estudante o que está
errado.

## R-04. Leitura pura (`lerArquivo`)

Ordem das verificações; a primeira que falha decide o motivo (data-model, "Motivo de recusa"):

| # | Verificação | Motivo |
| --- | --- | --- |
| 1 | texto com mais de `TAMANHO_MAXIMO_ARQUIVO` (1 MB = 1 048 576 bytes, medido em UTF-8) | `grande-demais` |
| 2 | texto vazio ou só espaços | `nao-e-projeto` |
| 3 | `JSON.parse` falha | `nao-e-projeto` |
| 4 | raiz não é objeto, ou `formato !== 'meupia-blocos'` | `nao-e-projeto` |
| 5 | `versao` inteiro `> VERSAO_FORMATO` | `versao-nova` |
| 6 | `versao` não é inteiro `≥ 1` | `dados-invalidos` |
| 7 | `nome` não é `string` | `dados-invalidos` |
| 8 | `variaveis` não é array; item sem `id` string não vazia, sem `nome` string ou com `tipo` fora de `TIPOS_VARIAVEL` | `dados-invalidos` (tipo desconhecido tem detalhe próprio) |
| 9 | `id` de variável repetido; `nome` recusado por `validarNomeVariavel` contra as anteriores (inclui duplicado sem diferenciar maiúsculas) | `dados-invalidos` |
| 10 | `blocos` não é objeto, ou `blocos.blocks.blocks` não é array (`{}` é aceito como "sem blocos" e recusado no R-05 por faltar o programa) | `dados-invalidos` |

O nome de variável é validado porque um nome inválido geraria Portugol que o Core recusa
(princípio II). `blocos.variables`, se existir, é ignorado: a fonte é `variaveis` (008).
Chaves extras na raiz são ignoradas (um arquivo de versão 1 pode ganhar campos opcionais sem
quebrar).

O limite de 1 MB também é verificado em `File.size` antes de ler (R-07), para não ler um
arquivo enorme; a verificação no texto mantém o núcleo testável.

## R-05. Validação pura dos blocos (`validarBlocos`)

Percorre todos os blocos (topo, `inputs[*].block`, `next.block`, inclusive soltos):

| Regra | Detalhe da recusa |
| --- | --- |
| `type` registrado em `registroPadrao` | o bloco "xyz" não existe no meuPiá Blocos |
| `id` string não vazia e única no arquivo | há dois blocos com a mesma identificação |
| exatamente um bloco `programa`, de topo, `id: 'programa'` | falta o bloco programa / há mais de um bloco programa |
| bloco de topo com `x` e `y` numéricos (encaixados não precisam) | a posição de um bloco está faltando |
| chave de `inputs` é um `input_value`/`input_statement` da `definicao`, ou uma área dinâmica: `VALOR1…VALOR{n}` do escreva, `SENAO` do se com senão ligado | o bloco "leia" tem um encaixe que não existe |
| `fields`: `field_dropdown` com valor entre as opções da `definicao`; `NUM` do `numero` aceito pela regra pura do validador (`normalizarNumero(NUM) !== null`, `src/blocos/valores.js`, 003 R-07): só número inválido é recusado; `"007"` ou `"3,5"` (casos de aceitação escritos à mão) são aceitos e o validador do Blockly normaliza ao carregar; `VAR` com `id` presente em `variaveis` | um campo do bloco "…" tem um valor inválido / um bloco usa uma variável que não está no projeto |
| `extraState` do escreva: `valores` inteiro de 1 a `MAX_VALORES` | o bloco escreva tem uma quantidade de valores inválida |
| `extraState` do se: ausente (senão desligado) ou `{ senao: true/false }` | o bloco se tem dados inválidos |
| `encaixesIncompativeis(blocos.blocks, registro, tipos) = []` (006) | um valor lógico está encaixado onde só cabe número (R-06) |
| ligação `next` só em bloco com conexão seguinte; filho de `input_value` tem saída; de `input_statement` tem conexão anterior | um bloco está encaixado num lugar onde não cabe |

Blocos **incompletos** (encaixe sem bloco, variável não escolhida em `VAR`) e **soltos** são
válidos: carregam e geram os avisos da 008 (casos de borda da spec). `VAR` ausente ou `null`
é "não escolhida"; `VAR` com `id` inexistente é inválido.

Esta função é pura e fica no núcleo medido (`src/projeto/`), recebendo o registro como
parâmetro (padrão: `registroPadrao`), como o gerador.

## R-06. Encaixe inválido: `BadConnectionCheck` da 006 (pedido 2)

O contrato [tipos-encaixe.md](../006-blocos-operadores/contracts/tipos-encaixe.md), seção
"Regra para a spec 012", diz: o load lança `BadConnectionCheck` porque o verificador `meupia`
recusa o encaixe; a 012 trata o erro e mostra mensagem amigável em pt-BR, sem stack trace
(princípio V); `encaixesIncompativeis` pode apontar antes quais blocos estão errados.

**Decisão**: as duas coisas.

- **Antes**: `validarBlocos` chama `encaixesIncompativeis` e monta o detalhe com o check dos
  dois lados: "um valor lógico está encaixado onde só cabe número". Nomes: `Numero` →
  "número", `Texto` → "texto", `Logico` → "valor lógico"; vários checks juntam-se com " ou ".
- **Rede**: se mesmo assim o ensaio (R-03, etapa 3) lançar, `ensaiarCarga` devolve
  `{ ok: false, erro: 'encaixe' }` para `instanceof Blockly.serialization.exceptions.BadConnectionCheck`,
  `'encaixe'` também para `MissingConnection` e `'desconhecido'` para qualquer outro.
  `mensagemRecusa` traduz para a mensagem de dados inválidos com o detalhe "um bloco está
  encaixado num lugar onde não cabe". O nome da classe vem minificado
  (`BadConnectionCheck$$module$…`), por isso a comparação é por `instanceof`, nunca por nome.

Em nenhum caso a mensagem do Blockly (em inglês) chega à tela; ela vai só para
`console.warn` (detalhe técnico secundário, princípio V).

## R-07. Escolher o arquivo e a ordem da confirmação (pedido 4; FR-001, FR-005)

- **Escolha**: `<input type="file" id="arquivo-carregar" accept=".json,application/json" hidden>`
  no `index.html`; o clique em Carregar chama `input.click()`. Leitura com `await file.text()`
  (UTF-8). O `value` do input é zerado depois de cada escolha, para o mesmo arquivo poder ser
  escolhido de novo. Sem rede (RNF-06).
- **Cancelar a janela**: o input não dispara `change` (ou dispara com `files` vazio): nada
  acontece. Nenhum `cancel` precisa ser tratado.
- **Ordem**: escolher → ler → validar (R-03 etapas 1–3) → **se houver alterações não salvas,
  confirmar** → trocar o projeto. Assim:
  - um arquivo inválido nunca pede para descartar um trabalho que não seria descartado;
  - a confirmação é a mesma do Novo (001, FR-007): mesmo diálogo `confirmar`, com textos
    próprios: título "Carregar outro projeto?", mensagem "As alterações que não foram
    salvas serão perdidas.", botões "Descartar e carregar" e "Cancelar" (foco em Cancelar);
  - cancelar a confirmação não muda nada;
  - a escolha do arquivo acontece direto no clique, dentro do gesto do usuário (o navegador
    exige isso para abrir a janela de arquivos).

  **Alternativa rejeitada**: confirmar antes de abrir a janela de arquivos, como o Novo
  confirma antes de agir. Pergunta sobre descarte mesmo quando o estudante depois cancela a
  janela ou escolhe um arquivo inválido, e abrir a janela depois de um `await` depende da
  janela de ativação do navegador. O cenário 2 da História 1 ("pede confirmação antes de
  substituir o projeto") é cumprido nas duas ordens.

## R-08. Trocar o projeto e gerar o Portugol já (pedido 5; FR-003, FR-006)

Sequência em `carregarProjeto()` (`main.js`), igual à do Novo depois da confirmação:

1. `await controlador.parar()`: uma execução em andamento não continua com outro projeto
   (009, contracts/tela-execucao.md).
2. `projeto = { ...lido }`; `definirNome(lido.nome)` (texto exato, R-02).
3. `recarregarBlocos(ws, lido)`: load + `clearUndo` (Ctrl+Z não volta ao projeto anterior).
4. `tempoReal.atualizarAgora()`: o Portugol é gerado **no mesmo passo** em que os blocos
   aparecem (007: o painel nunca mostra o código do projeto anterior com os blocos novos; e
   avisos de incompletos e marca de soltos aparecem já).
5. `saida.mostrarOrientacao()`: Saída limpa (FR-006), o mesmo estado do Novo.
6. `referencia = assinaturaProjeto(projetoAtual())`; `mostrarAlteracoes(false)` (R-02).

Os eventos que o load dispara chegam ao `tempoReal.notificar`, mas o `atualizarAgora` do passo
4 já gerou; a geração agendada que vier depois produz o mesmo texto (gerador determinístico,
princípio II).

Se o `recarregarBlocos` real ainda assim lançar (não deveria: o ensaio passou com os mesmos
dados), o `main.js` recarrega o projeto que estava aberto, guardado antes do passo 1, e
mostra a mensagem de dados inválidos. É a última defesa; não há caminho de teste conhecido
que chegue lá.

## R-09. Como mostrar a recusa (FR-004; princípio V)

**Decisão**: um aviso modal com um botão só, reaproveitando o `<dialog id="dialogo-confirmacao">`:
nova função `avisar({ titulo, mensagem, ok })` em `src/ui/confirmacao.js`, que esconde o botão
Cancelar e foca o OK. Título "Não foi possível carregar"; botão "Entendi".

**Alternativas rejeitadas**: escrever na Saída (mudaria a Saída, e o FR-004 pede que nada
mude; a Saída é também onde a execução escreve); `window.alert` (botão no idioma do
navegador, mesmo motivo do `confirmar` da 001, R-04).

Mensagens (texto exato no [contrato](contracts/carregar.md)):

| Motivo | Mensagem |
| --- | --- |
| `nao-e-projeto` | Este arquivo não é um projeto do meuPiá Blocos. |
| `versao-nova` | Este projeto foi salvo numa versão mais nova do meuPiá Blocos. |
| `grande-demais` | Este arquivo é grande demais para ser um projeto do meuPiá Blocos (o limite é 1 MB). |
| `dados-invalidos` | Este projeto tem dados inválidos e não foi carregado: {detalhe}. |

As duas primeiras são as frases da spec (História 2, cenários 1 a 3).

## R-10. Testes

| Nível | Arquivo | O que prova |
| --- | --- | --- |
| unidade | `tests/unidade/formato.test.js` (acréscimos) | `lerArquivo`: cada linha do R-04; nome bruto; `blocos.variables` ignorado; ida e volta com `textoArquivo` |
| unidade | `tests/unidade/carregar.test.js` (novo) | `validarBlocos`: cada linha do R-05; incompletos e soltos aceitos; se sem `extraState` aceito; `mensagemRecusa`; `prepararCarregamento` de ponta a ponta; projeto com 100 blocos em < 2 s (SC-003) |
| unidade | `tests/unidade/carregar-blockly.test.js` (novo, headless) | SC-002: cada arquivo inválido da lista é recusado por `prepararCarregamento` **e**, quando chega ao ensaio, o ensaio também recusa; o workspace "aberto" (um headless com um projeto) continua com a mesma assinatura. Os casos da sondagem do R-03 viram testes. Também: o arquivo com encaixe incompatível, passado direto ao ensaio (`ensaiarNoWorkspace`, pulando `validarBlocos`), devolve `erro: 'encaixe'` pelo `BadConnectionCheck` real da 006; o de encaixe inexistente, `'encaixe'` pelo `MissingConnection`; o de tipo desconhecido, `'desconhecido'`. E SC-003 de ponta a ponta: validação + ensaio + carga de 100 blocos em < 2 s |
| unidade | `tests/unidade/tela-estrutura.test.js` (acréscimos) | `#botao-carregar` habilitado, input de arquivo `hidden` com `accept`, textos novos em pt-BR |
| aceitação | `tests/aceitacao/carregar.test.js` (novo) | SC-001: cada caso de `tests/aceitacao/casos/` → `textoArquivo` → `prepararCarregamento` → carga headless → `projetoDoWorkspace` → mesmo Portugol do caso, executado no `meupia-core` real com a saída esperada |
| manual | [quickstart.md](quickstart.md) | janela de arquivos, confirmação, aviso, Saída limpa, indicador oculto, Ctrl+Z não volta |

A aceitação compara o Portugol e a saída do Core, não a assinatura: casos escritos à mão
(`"007"`, `"3,5"`) são normalizados pelo validador do número ao carregar. A assinatura
("carregar deixa sem alterações") é conferida no teste headless com arquivos salvos pelo
editor.

`ensaiarCarga` fica em `src/ui/workspace.js` (fora da cobertura); o teste headless usa uma
cópia de mesma lógica no `tests/auxiliares/salvar-blockly.js` (`ensaiarNoWorkspace`), como a
011 fez com `carregarNoWorkspace`. Para não haver duas lógicas, a classificação do erro
(`classificarErroCarga(erro, excecoes)`) fica no núcleo (`carregar.js`), recebendo as classes
do Blockly por parâmetro, e as duas cópias só fazem `try { load } catch (e) { classificar }`.

## R-11. Dependências

Nenhuma nova. `File.text()`, `<input type="file">` e `<dialog>` são da plataforma (Chrome,
Firefox e Edge atuais).
