# Plano de implementação: Blocos de variáveis

**Branch**: `002-blocos-variaveis` | **Data**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/002-blocos-variaveis/spec.md` (RF-02)

**Ponto de partida**: a base já está na `main` (specs 008, 001 e 007). O gerador puro
já emite a seção `var` a partir de `projeto.variaveis` no formato do FR-004
(`src/portugol/variaveis.js`), e o `ctx.variavel` já resolve o `{ id }` do campo para
o nome (008). O registro de blocos é o ponto de encaixe (008,
[registro-blocos.md](../008-portugol-valido/contracts/registro-blocos.md)). A 007 deixou
pendências para a 002 (atualizar o Portugol ao mexer em variáveis, decidir o desfazer,
caso de aceitação com bloco solto real, passos A–J do quickstart dela). O inventário
completo está em [research.md](research.md), R-01.

## Resumo

A 002 entrega os primeiros blocos reais do editor:

1. **Regra do nome de variável**, pura (`src/projeto/nome-variavel.js`, dentro da
   cobertura): formato (FR-002), lista de nomes reservados (FR-003) com as quatro
   origens do research da 008/R-10 conferidas no código do Core 1.4.1 (R-02, R-03) e
   comparação sem diferenciar maiúsculas. Cada recusa tem uma mensagem pt-BR que diz a
   regra quebrada. A 012 reutiliza a mesma função ao carregar arquivos.
2. **Dois blocos** registrados no `registroPadrao` (`src/blocos/variaveis.js`):
   `variavel_recebe` (comando, gera `nome <- valor`, FR-005) e `variavel` (valor, gera
   o nome, FR-006). O gerador não muda.
3. **A caixa de blocos** (toolbox), que ainda não existe: uma categoria "Variáveis"
   dinâmica com o botão "Criar variável…", um bloco "recebe" e um bloco de valor por
   variável. A definição é pura (`src/blocos/caixa-blocos.js`), para a 003–006
   acrescentarem as categorias delas.
4. **Fonte das variáveis = mapa de variáveis do Blockly** (R-04). O `main.js` passa a
   montar `projeto.variaveis` a partir do workspace a cada geração. Criar, renomear,
   mudar o tipo e apagar disparam eventos não-UI do Blockly, então o atualizador da 007
   já regenera o Portugol e o desfazer do Blockly já cobre essas ações. Isso resolve a
   pendência da 007 sem `tempoReal.solicitar()` extra.
5. **Interface** (fora da cobertura): diálogo pt-BR para criar (nome + tipo),
   renomear e mudar o tipo, com o erro mostrado no próprio diálogo; campo de variável
   próprio cujo menu oferece "Renomear variável…", "Mudar o tipo…" e "Apagar a
   variável"; confirmação de apagar com o total real de blocos removidos, incluindo os
   encaixados nos usos (FR-008), usando o `confirmar` da 001.

## Contexto técnico

**Linguagem/Versão**: JavaScript ES2022 (ES Modules), HTML e CSS. Node.js ≥ 20 para
ferramentas e testes.

**Dependências principais**: as mesmas da 008/001/007 (`blockly` 12.5.1, `pyodide`
0.25.0; `vite`, `vitest`, `@vitest/coverage-v8` em dev). **Nenhuma dependência nova**
(R-09).

**Armazenamento**: nenhum. As variáveis vivem no mapa de variáveis do workspace;
`projeto.variaveis` é derivado dele a cada geração (R-04). Salvar/carregar é da
011/012.

**Testes**: Vitest. Projeto `unidade`: regra do nome (todas as mensagens, todos os
grupos de reservados, maiúsculas, limites 1/30), blocos (`gerar` com o registro real
e com blocos de teste para `idade <- 15` e `escreva(idade + 1)`), caixa de blocos
(conteúdo da categoria para 0, 1 e 4 variáveis), derivação de `variaveis` do mapa e
carga das variáveis no workspace. Projeto `aceitacao`: casos JSON novos rodando no
`meupia-core` 1.4.1 real, e um teste que compara a lista de reservados com
`keyword.kwlist` e `dir(builtins)` do Python do Pyodide (R-03). A parte de navegador
é verificada pelo [quickstart.md](quickstart.md).

**Plataforma-alvo**: navegadores modernos de notebook/desktop (Chrome, Firefox, Edge).

**Tipo de projeto**: aplicação web estática de página única, sem backend (RNF-06).

**Metas de desempenho**: validar um nome é instantâneo (lista em `Set`). O Portugol
continua atualizando em < 1 s com 100 blocos (SC-002 da 007), agora medido no
navegador com blocos reais (pendência da 007, passo I). SC-003 (criar e atribuir em
< 1 min) depende de poucos cliques: categoria → "Criar variável…" → nome/tipo →
arrastar "recebe" (R-07).

**Restrições**: regra do nome, definições de blocos e caixa de blocos não importam o
Blockly nem tocam o DOM (princípio II, testáveis em Node). `src/ui/` e `src/main.js`
seguem fora da cobertura. O campo de variável próprio estende o `FieldVariable` do
Blockly e por isso fica em `src/ui/`.

**Escala/Escopo**: três módulos de núcleo novos, um alterado (`registro.js`); três
módulos de interface novos, três alterados; um diálogo novo no `index.html`.

## Constitution Check

*GATE: precisa passar antes da Fase 0. Reavaliado depois da Fase 1.*

| Princípio | Verificação | Situação |
| --- | --- | --- |
| I. Ecossistema intocado | O Core só é lido para levantar os nomes reservados (R-02); nada dele é copiado: a lista é escrita aqui, com a origem anotada. Os testes de aceitação usam o pacote do PyPI pela `instalarCore` da 008. A versão continua só em `src/config.js`; o teste `versao-unica.test.js` continua valendo. Nenhuma lacuna do Core encontrada (R-02). | ✅ |
| II. Portugol válido por construção | O gerador não muda. Os blocos novos emitem só `nome <- valor` e o nome. Nomes que quebrariam o Core ou o Python gerado são recusados antes de existirem (SC-002), e o teste de aceitação confere a lista contra o Python real. Atribuição sem valor ou sem variável vira `???` + aviso (regra da 008). `gerar` de cada bloco é puro. | ✅ |
| III. Spec primeiro e rastreabilidade | Plan parte da spec 002 (RF-02). Tasks citam RF-02. Commits `002/Txxx (RF-02): …` e `docs(002) (RF-02): …`. O que depende das 003/006 (número 15, `escreva`, soma) fica em "Pendências para as specs 003 e 006". | ✅ |
| IV. Testes e cobertura | Os módulos novos ficam em `src/projeto/` e `src/blocos/` (já no `include` da cobertura). Casos de aceitação novos rodam no Core real; a meta-verificação da 008 passa a exigir os dois tipos novos (SC-002 da 008). `npm run cobertura` atualiza relatório e README na entrega. | ✅ |
| V. pt-BR e foco no iniciante | Blocos com as palavras do Portugol ("recebe"); o diálogo mostra os tipos com a palavra do Portugol e uma dica (`inteiro (número sem vírgula)`, `logico (verdadeiro ou falso)`…), R-07; diálogos, botões, menu do campo e mensagens de recusa em pt-BR, explicando a regra quebrada em vez de só "nome inválido". | ✅ |
| VI. Simplicidade de PoC | Zero dependências. Usa o mapa de variáveis, os eventos e o desfazer do próprio Blockly em vez de um modelo paralelo (R-04). Variáveis locais, vetores e listas fora do escopo (FR-009, Premissas). | ✅ |

**Resultado**: nenhuma violação. Tabela de complexidade vazia.

**Reavaliação após a Fase 1**: o desenho mantém todos os itens. Ponto de atenção: o
cenário `idade <- 15` (História 2) e `escreva(idade + 1)` (História 3) dependem de
blocos da 006 (número, soma) e da 003 (`escreva`). Eles são testados na unidade com
blocos de teste e voltam como caso de aceitação no Core quando esses blocos
existirem (R-08). Na aceitação da 002 a atribuição usa outra variável como valor
(`b <- a`), que já é Portugol completo.

## Estrutura do projeto

### Documentação (esta feature)

```text
specs/002-blocos-variaveis/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Fase 0: inventário, reservados, fonte das variáveis, Blockly
├── data-model.md        # Fase 1: Variável, regra do nome, blocos, caixa
├── quickstart.md        # Fase 1: validação no navegador e testes
├── contracts/
│   ├── nome-variavel.md      # API pura da regra do nome
│   ├── blocos-variaveis.md   # blocos variavel_recebe e variavel + caixa de blocos
│   └── editor-variaveis.md   # interface: diálogo, menu do campo, apagar, ligação no main
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; não criado aqui)
```

### Código-fonte (raiz do repositório)

Só arquivos novos (➕) ou alterados (✏️) por esta spec.

```text
src/
├── projeto/
│   ├── nome-variavel.js      ➕ validarNomeVariavel, NOMES_RESERVADOS, mensagens (núcleo)
│   └── variaveis.js          ➕ variaveisDoMapa, blocosComVariaveis, contarBlocosApagados, textoApagar (núcleo)
├── blocos/
│   ├── variaveis.js          ➕ BLOCO_VARIAVEL_RECEBE, BLOCO_VARIAVEL (núcleo)
│   ├── caixa-blocos.js       ➕ CAIXA_BLOCOS e conteudoCategoriaVariaveis (núcleo)
│   └── registro.js           ✏️ registra os dois blocos no registroPadrao
├── portugol/
│   └── precedencia.js        ➕ PRECEDENCIA.PRIMARIO (a 006 completa a escala)
├── ui/
│   ├── campo-variavel.js     ➕ campo próprio (estende FieldVariable): menu pt-BR
│   ├── dialogo-variavel.js   ➕ diálogo criar / renomear / mudar o tipo
│   ├── acoes-variavel.js     ➕ criar, renomear, mudar o tipo e apagar no workspace
│   ├── workspace.js          ✏️ toolbox, categoria dinâmica, carga das variáveis, lista do mapa
│   └── textos.js             ✏️ textos dos diálogos e do menu
├── main.js                   ✏️ projetoAtual() lê as variáveis do workspace; Novo zera
├── estilos.css               ✏️ diálogo de variável e erro inline
index.html                    ✏️ <dialog id="dialogo-variavel">

tests/
├── unidade/
│   ├── nome-variavel.test.js         ➕
│   ├── blocos-variaveis.test.js      ➕
│   ├── caixa-blocos.test.js          ➕
│   ├── variaveis-projeto.test.js     ➕
│   ├── variaveis-blockly.test.js     ➕ Blockly headless: ordem do mapa, ida e volta, renomear/apagar/desfazer
│   ├── tempo-real-cenarios.test.js   ✏️ usa teste_numero/teste_escreva do auxiliar (sem registro local)
│   ├── registro.test.js              ✏️ registroPadrao com os tipos novos
│   └── tela-estrutura.test.js        ✏️ diálogo novo, textos pt-BR
├── auxiliares/blocos-teste.js        ✏️ teste_numero, teste_soma, teste_escreva compartilhados
└── aceitacao/
    ├── nomes-reservados.test.js      ➕ lista × Python do Pyodide
    └── casos/
        ├── variaveis-atribuicao.json      ➕ a <- b, b <- a (Core real)
        ├── variaveis-nomes-limite.json    ➕ nomes válidos "perigosos" no Core
        └── variaveis-bloco-solto.json     ➕ atribuição solta fora do programa (pendência 007)
```

**Decisão de estrutura**: a regra do nome fica em `src/projeto/` (não em
`src/blocos/`) porque é regra do projeto: a 012 a usa ao validar um arquivo sem
haver bloco nenhum. Os blocos e a caixa ficam em `src/blocos/`, ao lado do
`programa`.

## Pendências para as specs 003 e 006

Registradas em R-08. Não são tasks desta spec:

- **006** (✅ resolvidas pela spec 006): caso de aceitação `idade <- 15` (História 2,
  cenário 1) com o bloco de número
  ([recebe-idade-quinze.json](../../tests/aceitacao/casos/recebe-idade-quinze.json));
  o tipo do bloco `variavel` e do encaixe do `recebe` segue o tipo da variável
  ([tipos-encaixe.md](../006-blocos-operadores/contracts/tipos-encaixe.md)); passo B do
  quickstart da 007 conferido no passo F do
  [quickstart da 006](../006-blocos-operadores/quickstart.md).
- **003** (✅ resolvidas pela spec 003): caso de aceitação `escreva(idade + 1)` → `16`
  com `idade <- 15` ([escreva-conta-idade.json](../../tests/aceitacao/casos/escreva-conta-idade.json));
  valores iniciais `0`, `0.0`, texto vazio e `falso` no Core
  ([escreva-valores-iniciais.json](../../tests/aceitacao/casos/escreva-valores-iniciais.json));
  `leia` com o mesmo campo de variável (`BLOCO_LEIA` em `src/blocos/entrada-saida.js`, caso
  [leia-quatro-tipos.json](../../tests/aceitacao/casos/leia-quatro-tipos.json)). O caso
  `idade <- 15` listado acima para a 006 também já existe (`escreva-conta-idade.json`), com
  o bloco de número antecipado pela 003.

## Complexity Tracking

Nenhuma violação da constituição a justificar.
