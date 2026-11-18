# Plano de implementação: Carregar projeto em JSON

**Branch**: `012-carregar-projeto` | **Data**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/012-carregar-projeto/spec.md` (RF-12), com cinco
orientações: (1) as Premissas sobre o que a 011 deixou pronto: a leitura fica em
`src/projeto/formato.js`; se sem `extraState` é senão desligado; o nome do programa volta como
foi digitado; carregar marca a referência de "sem alterações"; (2) da 006, o arquivo com
encaixe inválido: o Blockly lança `BadConnectionCheck`
([contracts/tipos-encaixe.md da 006](../006-blocos-operadores/contracts/tipos-encaixe.md)) e
a 012 mostra mensagem amigável em pt-BR; (3) a decisão do [specs/README.md](../README.md): o
arquivo inteiro é validado antes de mexer no projeto aberto; (4) carregar com alterações não
salvas pede confirmação, como o Novo (001, FR-007); (5) o Portugol é gerado assim que os
blocos aparecem (007).

**Ponto de partida**: `formato.js` (escrita v1), `alteracoes.js` (assinatura), `variaveis.js`
(`blocosComVariaveis`), `nome-variavel.js` (`validarNomeVariavel`), `tipos.js`
(`encaixesIncompativeis`) e o `novoProjeto()` do `main.js` já existem. Inventário em
[research.md](research.md), R-01.

## Resumo

1. **Leitura pura** (R-02, R-04; FR-002, pedido 1): `lerArquivo(texto)` em `formato.js` —
   tamanho, JSON, `formato`, `versao`, `nome` (bruto), `variaveis` (tipos e nomes válidos) e
   forma de `blocos`. Devolve motivo de recusa, nunca lança.
2. **Validação pura dos blocos** (R-05, R-06; FR-002, pedido 2): `validarBlocos` em
   `src/projeto/carregar.js` contra o `registroPadrao`: tipos conhecidos, `programa` único,
   ids, encaixes e campos existentes, `VAR` de variável do projeto, `extraState` do escreva
   (1..10) e do se (**ausente = senão desligado**), e `encaixesIncompativeis` da 006 com
   mensagem "um valor lógico está encaixado onde só cabe número".
3. **Ensaio antes de tocar a tela** (R-03, R-06; pedido 3): `ensaiarCarga` faz o
   `workspaces.load` num workspace headless descartável com o verificador `meupia`;
   `BadConnectionCheck`/`MissingConnection` viram recusa amigável (`classificarErroCarga`, no
   núcleo). Só depois de passar pelas três etapas o projeto aberto é trocado.
4. **Confirmação como o Novo** (R-07; FR-005, pedido 4): escolher → validar → se há alterações
   não salvas, `confirmar` ("Carregar outro projeto?") → trocar. Arquivo inválido ou janela
   cancelada nunca perguntam.
5. **Troca e Portugol imediato** (R-08; FR-003, FR-006, pedido 5): parar execução → nome exato
   → `recarregarBlocos` (desfazer zerado) → `tempoReal.atualizarAgora()` → Saída limpa →
   `referencia = assinaturaProjeto(projetoAtual())` e indicador oculto (pedido 1).
6. **Recusa visível** (R-09; FR-004): `avisar` (diálogo de um botão, pt-BR) com as mensagens
   da spec; o detalhe técnico do Blockly só no console.
7. **Testes** (R-10; SC-001 a SC-003): unidade do núcleo, lista de inválidos headless que
   prova "nada muda", aceitação de todos os casos pelo caminho do Carregar no `meupia-core`
   real.

## Contexto técnico

**Linguagem/Versão**: JavaScript ES2022 (ES Modules). Node.js ≥ 20 para ferramentas e testes.

**Dependências principais**: as mesmas (`blockly` 12.5.1, `pyodide` 0.25.0; `vite`, `vitest`,
`@vitest/coverage-v8` em dev). **Nenhuma dependência nova** (R-11).

**Armazenamento**: lê um arquivo `.json` escolhido pelo estudante (`<input type="file">` +
`File.text()`); formato v1 da 011/008 sem mudança ([data-model.md](data-model.md)). Nada no
navegador (sem `localStorage`), nenhuma rede.

**Testes**: Vitest.

- `unidade`: `formato.test.js` (acréscimos), `carregar.test.js` (novo),
  `carregar-blockly.test.js` (novo, headless), `tela-estrutura.test.js` (botão, input, textos).
- `aceitacao`: `carregar.test.js` (novo), sobre todos os casos de `tests/aceitacao/casos/`.
- Janela de arquivos, confirmação, aviso, execução parada: [quickstart.md](quickstart.md).

**Plataforma-alvo**: Chrome, Firefox e Edge em notebook/desktop.

**Tipo de projeto**: aplicação web estática de página única, sem backend (RNF-06).

**Metas de desempenho**: carregar até 100 blocos em menos de 2 s (SC-003): validação linear
no número de blocos + dois loads do Blockly (ensaio headless e tela).

**Restrições**:

- Tudo que decide aceitar ou recusar é puro e fica em `src/projeto/` (princípio IV).
- Nenhum passo antes da troca final mexe no workspace da tela, no nome, na Saída, na
  execução, no desfazer ou na `referencia` (FR-004; decisão do README).
- Mensagens do Blockly (inglês) nunca chegam à tela (princípio V).

**Escala/Escopo**: um módulo novo no núcleo (`src/projeto/carregar.js`), um alterado
(`src/projeto/formato.js`); um novo na interface (`src/ui/arquivo.js`), cinco alterados
(`src/ui/workspace.js`, `src/ui/confirmacao.js`, `src/ui/barra.js`, `src/ui/textos.js`,
`src/main.js`), mais `index.html` e um auxiliar de teste.

## Constitution Check

*GATE: precisa passar antes da Fase 0. Reavaliado depois da Fase 1.*
Constitution v2.0.0.

| Princípio | Verificação | Situação |
| --- | --- | --- |
| I. Ecossistema intocado | Nada do Core é usado no Carregar; a aceitação usa o `meupia-core` pelo adapter existente. Versão só em `src/config.js`. | ✅ |
| II. Portugol válido por construção | O gerador não muda. A carga só aceita projetos cujo conteúdo o editor poderia ter montado (tipos, nomes de variável da 002, encaixes da 006), então o Portugol continua válido; incompletos e soltos carregam e geram os avisos da 008. Portugol gerado no mesmo passo da carga (007). | ✅ |
| III. Spec primeiro e rastreabilidade | Plan parte da spec 012 (RF-12) e cita 001 (FR-007), 002, 003, 004, 006, 007, 008, 009 e 011 nos pontos reaproveitados. Commits por fase `012/Txxx-Tyyy (RF-12[, RF-01]): …` e `docs(012) (RF-12): …`. | ✅ |
| IV. Testes e cobertura | "Serialização de projeto" está no núcleo medido: `formato.js` e `carregar.js` em `src/projeto/**`, inclusive a classificação dos erros do Blockly. Aceitação com o Core real a partir dos casos em JSON, passando pelo caminho do Carregar. Ficam fora só `arquivo.js`, `workspace.js`, `confirmacao.js`, `barra.js` e `main.js` (exclusão já declarada). | ✅ |
| V. pt-BR e foco no iniciante | Botão, dica, confirmação, aviso e todas as mensagens de recusa em pt-BR, com o motivo em linguagem do iniciante; o texto do Blockly vai só para o console. A janela de escolha de arquivo é do sistema operacional, como em qualquer site; não é texto do editor. | ✅ |
| VI. Simplicidade de PoC | Zero dependências; `<input type="file">` em vez da File System Access API; sem migração de versões (só v1 existe); um diálogo reaproveitado. | ✅ |

**Resultado**: nenhuma violação.

**Reavaliação após a Fase 1**: o desenho mantém todos os itens. Pontos de atenção:

1. **Dois loads do Blockly por carga** (ensaio + tela). Custa alguns milissegundos para 100
   blocos e é o que garante "nada muda" mesmo para erros que a validação pura não previu
   (R-03). Aceito.
2. **Validação pura e ensaio podem divergir** se um bloco novo ganhar regra de carga só no
   Blockly. O teste headless roda a lista de inválidos pelas duas etapas e o teste de ida e
   volta usa **todos** os tipos do registro (como a 011), então um tipo novo sem cobertura
   faz o teste falhar.
3. **Confirmação depois da escolha do arquivo** (R-07): diferente da ordem do Novo, mas com a
   mesma pergunta e o mesmo diálogo; evita perguntar à toa e respeita a ativação do usuário
   exigida pela janela de arquivos.
4. **Nome bruto**: o arquivo pode trazer um nome que o campo nunca produziria (quebra de
   linha). O campo `<input>` mostra o que puder; o Portugol sai saneado pelo gerador, como já
   acontece com o que é digitado. Sem regra nova.

## Estrutura do projeto

### Documentação (esta feature)

```text
specs/012-carregar-projeto/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Fase 0: inventário, sondagem do Blockly, validação, ensaio, ordem
├── data-model.md        # Fase 1: regras de leitura, motivo de recusa, transições
├── quickstart.md        # Fase 1: validação nos testes e no navegador
├── contracts/
│   ├── carregar.md      # núcleo: lerArquivo, validarBlocos, prepararCarregamento, mensagens
│   └── tela-carregar.md # interface: botão, input, avisar, ensaiarCarga, main.js
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; não criado aqui)
```

### Código-fonte (raiz do repositório)

Só arquivos novos (➕) ou alterados (✏️) por esta spec.

```text
index.html                       ✏️ botão Carregar habilitado; input#arquivo-carregar hidden
src/
├── projeto/
│   ├── formato.js               ✏️ TAMANHO_MAXIMO_ARQUIVO, lerArquivo (Premissas: leitura aqui)
│   ├── alteracoes.js            — sem mudança (assinaturaProjeto para a referência)
│   └── carregar.js              ➕ validarBlocos, prepararCarregamento, mensagemRecusa,
│                                   classificarErroCarga, recusaDoEnsaio (núcleo)
├── ui/
│   ├── arquivo.js               ➕ escolherArquivo, lerTexto
│   ├── workspace.js             ✏️ ensaiarCarga
│   ├── confirmacao.js           ✏️ avisar
│   ├── barra.js                 ✏️ aoCarregar
│   └── textos.js                ✏️ carregarDica, carregarTitulo, carregarMensagem,
│                                   carregarConfirmar, carregarFalhouTitulo, entendi
└── main.js                      ✏️ carregarProjeto
tests/
├── auxiliares/
│   └── salvar-blockly.js        ✏️ ensaiarNoWorkspace (mesma lógica do ensaiarCarga)
├── unidade/
│   ├── formato.test.js          ✏️ lerArquivo
│   ├── carregar.test.js         ➕ validarBlocos, mensagens, prepararCarregamento, 100 blocos
│   ├── carregar-blockly.test.js ➕ lista de inválidos pelas três etapas; nada muda; ida e volta
│   └── tela-estrutura.test.js   ✏️ botão Carregar, input, textos
└── aceitacao/
    └── carregar.test.js         ➕ cada caso pelo caminho do Carregar → Core real
README.md                        ✏️ linha de testes e cobertura
cobertura/                       ✏️ relatório versionado
```

**Decisão de estrutura**: mesma árvore das specs anteriores; o núcleo do Carregar fica em
`src/projeto/` ao lado do formato e do Salvar, e a interface em `src/ui/`.

## Rastreabilidade

| Requisito | Onde |
| --- | --- |
| FR-001 | `#arquivo-carregar`, `escolherArquivo`, `aoCarregar` |
| FR-002 | `lerArquivo`, `validarBlocos`, `ensaiarCarga` |
| FR-003 | `carregarProjeto` (`recarregarBlocos`, `definirNome`, `atualizarAgora`); aceitação |
| FR-004 | três etapas antes da troca; `mensagemRecusa`, `avisar`; `carregar-blockly.test.js` |
| FR-005 | `haAlteracoes` + `confirmar` em `carregarProjeto` |
| FR-006 | `saida.mostrarOrientacao()` em `carregarProjeto` |
| 001 FR-007 | mesma confirmação; `referencia` marcada depois de carregar |
| 006 (Regra para a 012) | `encaixesIncompativeis` em `validarBlocos`; `classificarErroCarga` |
| 007 FR-001 | `tempoReal.atualizarAgora()` logo depois do `recarregarBlocos` |
| 011 (Premissas) | `lerArquivo` em `formato.js`; se sem `extraState`; nome bruto; `referencia` |
| SC-001 | `tests/aceitacao/carregar.test.js`, ida e volta em `carregar-blockly.test.js` |
| SC-002 | lista de inválidos em `carregar.test.js` e `carregar-blockly.test.js` |
| SC-003 | teste de 100 blocos |

## Acompanhamento de complexidade

Nenhuma violação a justificar.
