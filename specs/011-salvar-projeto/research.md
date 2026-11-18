# Pesquisa (Fase 0): Salvar projeto em JSON

Decisões técnicas da spec 011 (RF-11). Cada item segue: decisão, motivo, alternativas.

---

## R-01. Inventário: o que já existe na `main`

| Peça | Situação | O que falta na 011 |
| --- | --- | --- |
| `src/projeto/formato.js` (008, 001) | **Existe**: `FORMATO = 'meupia-blocos'`, `VERSAO_FORMATO = 1`, `TIPOS_VARIAVEL`, `projetoVazio()`. Usado por `main.js`, blocos, gerador e testes. | Ganhar `montarArquivo(projeto)` e `textoArquivo(projeto)`: o arquivo v1 com as chaves na ordem fixa. **Reaproveitado**, não recriado. |
| `src/projeto/alteracoes.js` (001) | **Existe**: `assinaturaProjeto`, `haAlteracoes`; `main.js` guarda `referencia` e o Novo consulta (001, FR-007). | Nada no módulo. O Salvar passa a **atualizar `referencia`** (001, data-model, "Referência de salvo", linha "Projeto salvo \| 011"). **Reaproveitado** sem mudança. |
| `projetoAtual()` em `src/main.js` | **Existe**: `{ ...projeto, variaveis: variaveisDoWorkspace(ws), blocos: serializarBlocos(ws) }`. | É a entrada do Salvar: o mesmo objeto que o gerador e a assinatura já usam. |
| `serializarBlocos(ws)` (001, 002) | **Existe**: `workspaces.save` sem `blocos.variables`. Inclui `extraState` dos mutadores (003, 004), `x`/`y` dos blocos de topo, blocos soltos e incompletos. | Nada. |
| `variaveisDoWorkspace(ws)` (002) | **Existe**: `{ id, nome, tipo }` na ordem do mapa do Blockly (ordem de criação dentro do tipo, 002 R-04). | Nada. |
| Botão `#botao-salvar` (001) | `disabled` com `title="Disponível em breve"`. | Habilitar e ligar (`ligarBarra` ganha `aoSalvar`). |
| Indicação "alterações não salvas" e `beforeunload` | Não existem. | Novos na interface (História 2, FR-006). |
| Leitura/validação do arquivo | Não existe. | **Fora**: é da 012. |

---

## R-02. O que o arquivo guarda (pedido: "tudo que as specs anteriores criaram")

**Decisão**: o arquivo é o **Projeto v1 da 008**, escrito com as chaves nesta ordem:
`formato`, `versao`, `nome`, `variaveis`, `blocos`. O conteúdo vem só de `projetoAtual()`,
sem filtrar nada. Conferência, spec por spec, de que nada se perde:

| Origem | Estado | Onde fica no arquivo |
| --- | --- | --- |
| 008 / Q-06 | identificação e versão | `formato: "meupia-blocos"`, `versao: 1` |
| 001, 007 | nome do programa | `nome`, **valor bruto do campo** (o gerador saneia ao gerar; carregar devolve ao campo o que o estudante digitou) |
| 002 | variáveis com tipo e ordem de criação | `variaveis: [{ id, nome, tipo }]`, na ordem de `variaveisDoWorkspace` |
| 002 | uso das variáveis nos blocos | campo `VAR: { id }` nos blocos |
| 003 | número de valores do `escreva` | `extraState: { valores: n }` (o mutador sempre grava, 1..10) |
| 004 | senão ligado ou desligado | ligado: `extraState: { senao: true }`; desligado: sem `extraState` (o mutador devolve `null`, que o Blockly não grava). Os comandos do senão ficam em `inputs.SENAO`. |
| 005, 006, 003 | blocos de repetição, operadores, valores, leia/escreva | nós comuns em `blocos.blocks.blocks[]`, com `fields`, `inputs`, `next` |
| 001, 007 | posições e blocos soltos/incompletos | `x`, `y` dos blocos de topo; topos que não são `programa` ficam no array; encaixe vazio = chave ausente |

**Ordem das variáveis**: `getAllVariables()` devolve os tipos na ordem do primeiro de cada
tipo e, dentro do tipo, a ordem de inserção (002 R-04). O `workspaces.load` recria as
variáveis na ordem do array. Logo, salvar o array como sai do mapa e carregá-lo devolve o
**mesmo array**: a seção `var` e o "último inteiro" da categoria Repetição (005 R-09)
continuam iguais. Isso é conferido no teste de ida e volta (R-06).

**Motivo**: o formato já é o que a suíte de aceitação usa (`caso.projeto`, 008) e o que a
012 vai ler. Escrever outro objeto ("só o necessário") criaria uma segunda definição que
diverge na primeira spec nova de bloco.

**Alternativas consideradas**: guardar o Portugol gerado junto (rejeitado: é derivado,
e duas fontes podem discordar); guardar `blocos.variables` do Blockly (rejeitado: a 008
proíbe duas listas).

---

## R-03. Onde ficam as funções novas

**Decisão**:

- `src/projeto/formato.js` (reaproveitado) ganha `montarArquivo(projeto)` e
  `textoArquivo(projeto)`: o formato do arquivo mora num lugar só, junto de `FORMATO` e
  `VERSAO_FORMATO`. A 012 lê pelo mesmo módulo.
- `src/projeto/salvar.js` (novo, núcleo, dentro da cobertura) tem `nomeArquivo(nome)` e
  `prepararSalvamento(projeto) → { nomeArquivo, texto, referencia }`, que junta o formato
  com `assinaturaProjeto` de `alteracoes.js`.
- `src/ui/download.js` (novo, interface, fora da cobertura) entrega o texto como download.

**Motivo**: tudo que decide **o que** é salvo é puro e testável no Node; o único passo com
DOM é o download. `src/projeto/**` já está no `include` da cobertura.

**Alternativas**: tudo em `main.js` (rejeitado: fora da cobertura, viola o princípio IV
para "serialização de projeto"); `nomeArquivo` em `formato.js` (rejeitado: nome de arquivo
é regra do Salvar, não do formato).

---

## R-04. Texto do arquivo

**Decisão**: `JSON.stringify(montarArquivo(projeto), null, 2) + '\n'`, UTF-8, LF.

- Indentação de 2 espaços e quebra de linha: legível num editor de texto (SC-003, História
  1 cenário 2).
- Acentos ficam como caracteres (sem `\uXXXX`): `JSON.stringify` não escapa não-ASCII, e o
  `Blob` grava UTF-8.
- Determinístico: mesma entrada, mesmo texto (facilita comparar arquivos e testar).
- `montarArquivo` **copia** (não devolve referências do projeto aberto): FR-005.

**Alternativas**: JSON compacto (rejeitado: SC-003); chaves ordenadas alfabeticamente
(rejeitado: `formato` e `versao` primeiro identificam o arquivo para quem abre).

---

## R-05. Nome do arquivo

**Decisão**: `nomeArquivo(nome)`:

1. `String(nome ?? '')`, sem espaços nas pontas;
2. cada caractere de `/ \ : * ? " < > |` e cada caractere de controle (U+0000–U+001F,
   U+007F) vira `_`;
3. resultado vazio → `MeuPrograma`;
4. acrescenta `.json`.

`"Media"` → `Media.json`; `"a/b:c"` → `a_b_c.json`; `""` e `"   "` → `MeuPrograma.json`.
Acentos e espaços internos ficam (`"Média final"` → `Média final.json`).

**Motivo**: é o que a spec pede (FR-003 e casos de borda), mais os caracteres de controle,
que nenhum sistema aceita em nome de arquivo. O campo tem `maxlength="40"`, então o nome não
passa do limite dos sistemas de arquivos. Nomes reservados do Windows (`CON`, `NUL`) e
pontos no fim são tratados pelo próprio navegador ao baixar; não vale regra própria na PoC.

**Alternativas**: usar o nome saneado do gerador (`sanearNomePrograma`). Rejeitado: ele tira
`"` e `\` em vez de trocar por `_`, que é a regra da spec.

---

## R-06. Download sem servidor

**Decisão**: `baixarArquivo(nome, texto)` em `src/ui/download.js`:
`new Blob([texto], { type: 'application/json' })` → `URL.createObjectURL` → `<a download>`
temporário clicado por código → `URL.revokeObjectURL` logo depois (num `setTimeout` de 0).
Nenhum `fetch`, `XMLHttpRequest` ou `navigator.sendBeacon` (FR-004).

**Motivo**: funciona em Chrome, Firefox e Edge, sem dependência e sem permissão. O arquivo
nasce no navegador.

**Limitação aceita**: se o navegador estiver configurado para perguntar onde salvar e o
estudante cancelar, a página não fica sabendo. O projeto já terá sido marcado como salvo
(R-07). Aceito na PoC: o caso comum é o download direto, e o Novo/fechar seguinte pergunta
de novo assim que houver qualquer alteração.

**Alternativas**: `showSaveFilePicker` (File System Access API). Rejeitada: só existe no
Chromium, exigiria o caminho com `<a download>` mesmo assim, e o diálogo muda de idioma com
o sistema.

---

## R-07. Salvar marca "sem alterações não salvas" (pedido 2; 001, FR-007)

**Decisão**: em `main.js`, o clique em Salvar faz:

```text
tempoReal.atualizarAgora()                 // nada pendente fica de fora
p = projetoAtual()
{ nomeArquivo, texto, referencia } = prepararSalvamento(p)
baixarArquivo(nomeArquivo, texto)
referencia (global) = referencia           // = assinaturaProjeto(p)
mostrarAlteracoes(false)
```

A assinatura é tirada **do mesmo objeto que foi gravado**, então logo depois do Salvar
`haAlteracoes(projetoAtual(), referencia) === false`: o **Novo** não pede confirmação
(001, FR-007) e o `beforeunload` não pergunta. Qualquer mudança depois (bloco, posição,
variável, nome) volta a dar `true`, como a 001 R-05 já define. Desfazer até o estado salvo
volta a "sem alterações".

**Motivo**: reaproveita a referência e a função da 001 sem mudar `alteracoes.js`; o
contrato do Novo continua o mesmo.

**Alternativas**: flag "sujo" ligada por evento (rejeitada na 001 R-05).

---

## R-08. Indicação "alterações não salvas" e confirmação ao sair (História 2, FR-006)

**Decisão**:

- `<span id="indicador-alteracoes" aria-live="polite" hidden>` logo depois do campo do nome,
  com o texto `TEXTOS.alteracoesNaoSalvas` = "alterações não salvas".
- Atualizado em `atualizarPortugol()` (que roda depois de todo evento não-UI, do fim do
  arraste e da edição do nome, pela 007) e depois de Novo e Salvar:
  `mostrarAlteracoes(haAlteracoes(projetoGerado, referencia))`. Custo: um `JSON.stringify`
  por geração, desprezível para 100 blocos.
- `window.addEventListener('beforeunload', ...)`: se `haAlteracoes(projetoAtual(),
  referencia)`, chama `evento.preventDefault()` e define `evento.returnValue = ''`.

**pt-BR**: o diálogo do `beforeunload` é do navegador; o texto não é configurável desde
2016 e segue o idioma do navegador. É o único jeito de pedir confirmação ao fechar a aba
(FR-006). Registrado como ponto de atenção no plan; a indicação na barra, que é do editor,
é em pt-BR.

**Alternativas**: um diálogo próprio ao fechar (impossível: a página não controla o
fechamento); só a indicação sem `beforeunload` (rejeitado: FR-006 exige as duas).

---

## R-09. Testes

**Decisão**:

- `tests/unidade/formato.test.js` (existe): `montarArquivo` (ordem das chaves, defaults,
  cópia sem compartilhar referência, sem `blocos.variables`) e `textoArquivo` (2 espaços,
  `\n` final, acentos legíveis, determinismo).
- `tests/unidade/salvar.test.js` (novo): `nomeArquivo` (tabela do R-05) e
  `prepararSalvamento` (texto = `textoArquivo`, `referencia` = `assinaturaProjeto`,
  `haAlteracoes(p, referencia) === false`, projeto não modificado, 100 blocos em < 1 s, sem
  `fetch`/`XMLHttpRequest`/`sendBeacon` em `salvar.js` e `download.js`).
- `tests/unidade/salvar-blockly.test.js` (novo, headless como `repeticao-blockly.test.js`):
  monta no workspace um projeto com **todos os tipos registrados** (`tiposRegistrados()`),
  `escreva` com 3 valores, `se` com e sem senão, variáveis dos quatro tipos criadas fora da
  ordem dos tipos, um bloco solto e um incompleto; serializa como o `main.js`, passa por
  `prepararSalvamento`, faz `JSON.parse` do texto, carrega num workspace novo com
  `blocosComVariaveis` (o que a 012 fará) e confere: serialização igual, `variaveis` igual
  (mesma ordem), `extraState` preservado e `gerarPortugol` idêntico (base do SC-001).
- `tests/aceitacao/salvar.test.js` (novo): para cada caso de `tests/aceitacao/casos/`,
  carrega `caso.projeto` num workspace headless, monta o projeto como o `projetoAtual()` do
  `main.js` (`variaveisDoMapa` + `workspaces.save` sem `variables`), passa por
  `prepararSalvamento`, faz `JSON.parse` do texto e confere que o Portugol é o mesmo de
  `gerarPortugol(caso.projeto)` e que roda no `meupia-core` real com a `saidaEsperada`
  (princípio IV; premissa "mesmo formato dos projetos de exemplo"). Como a meta-aceitação da
  008 exige todo par (tipo, variante) em algum caso, o caminho do Salvar passa por todas as
  variantes de todos os blocos.
- `tests/unidade/tela-estrutura.test.js` (existe): `botao-salvar` sem `disabled` e sem
  `title="Disponível em breve"`; `indicador-alteracoes` presente com `hidden`; a chave
  `alteracoesNaoSalvas` em `TEXTOS`.
- O que só existe no navegador (download real, nome do arquivo baixado, indicação, Novo sem
  confirmação, `beforeunload`) fica no [quickstart.md](quickstart.md).

---

## R-10. Dependências

**Decisão**: nenhuma dependência nova. `Blob`, `URL.createObjectURL` e `beforeunload` são
APIs do navegador.
