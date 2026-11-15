# Plano de implementação: Portugol gerado em tempo real

**Branch**: `007-portugol-tempo-real` | **Data**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/007-portugol-tempo-real/spec.md` (RF-07)

**Ponto de partida**: a base já está na `main` (specs 008 e 001). Este plan
**reaproveita** o gerador puro `gerarPortugol`, o registro de blocos, o bloco raiz
`programa`, o painel Portugol (`mostrarCodigo`), a marcação de avisos
(`aplicarAvisos`) e o `recarregarBlocos` com `clearUndo`. Nenhum contrato do núcleo
muda. O inventário do que já existe e do que falta está em
[research.md](research.md), R-01.

## Resumo

Hoje o `main.js` já regenera o Portugol a cada evento não-UI do Blockly e a cada
`input` do nome. Isso cobre parte do FR-001, mas tem três falhas: (1) o Portugol muda
**no começo** do arraste, porque o Blockly desencaixa o bloco ao pegá-lo (caso de
borda da spec); (2) cada evento de um mesmo gesto gera de novo (um encaixe dispara
vários eventos); (3) a troca do texto pode levar a rolagem do painel.

A 007 entrega:

1. **Atualizador em tempo real** puro (`src/portugol/tempo-real.js`, dentro da
   cobertura). Recebe os eventos do editor, ignora os de interface, **suspende durante
   o arraste** e agrupa vários eventos numa única geração por quadro
   (`requestAnimationFrame`). Bem abaixo do limite de 1 s (FR-002).
2. **Blocos fora do programa** (`src/portugol/fora-do-programa.js`, dentro da
   cobertura): lista os blocos de topo que não são o `programa`. O gerador já os
   ignora (FR-003, 008/R-13); a interface marca o primeiro bloco de cada pilha solta
   com o aviso "Esta pilha está fora do programa" (FR-004). A marca **não** bloqueia a
   execução: não é aviso de bloco incompleto.
3. **Desfazer e refazer** (FR-006) sobre a pilha de desfazer do Blockly, que já
   funciona com Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z e pelo menu de contexto. A 007
   acrescenta os botões **Desfazer** e **Refazer** no cabeçalho do painel Blocos,
   habilitados conforme a pilha.
4. **Rolagem mantida** (FR-005): `mostrarCodigo` guarda e restaura a rolagem do corpo
   do painel Portugol e não mexe no DOM quando o texto não mudou.

## Contexto técnico

**Linguagem/Versão**: JavaScript ES2022 (ES Modules), HTML e CSS. Node.js ≥ 20 para
ferramentas e testes.

**Dependências principais**: as mesmas da 008/001 (`blockly` 12.5.1, `pyodide`
0.25.0; `vite`, `vitest`, `@vitest/coverage-v8` em dev). **Nenhuma dependência nova**
(R-08).

**Armazenamento**: nenhum. A pilha de desfazer é a do Blockly, só em memória.

**Testes**: Vitest, projeto `unidade`. Testes novos para o atualizador (com
agendador e eventos falsos, sem Blockly) e para `blocosForaDoPrograma`; teste de
cenários que encadeia estados de projeto com o registro de teste
(`tests/auxiliares/blocos-teste.js`); `tela-estrutura.test.js` estendido com os
botões novos. A parte de navegador é verificada pelo [quickstart.md](quickstart.md).

**Plataforma-alvo**: navegadores modernos de notebook/desktop (Chrome, Firefox, Edge).

**Tipo de projeto**: aplicação web estática de página única, sem backend (RNF-06).

**Metas de desempenho**: Portugol atualizado em < 1 s após a alteração em programas de
até 100 blocos (FR-002, SC-002). Orçamento real: uma geração por quadro (~16 ms de
espera) + serializar e gerar 100 blocos (poucos ms; a 008 já testa 100 blocos no
gerador).

**Restrições**: o atualizador e a regra de "fora do programa" não importam o Blockly
nem tocam o DOM (princípio II, testáveis em Node). `src/ui/` e `src/main.js` seguem
fora da cobertura.

**Escala/Escopo**: dois módulos de núcleo novos, quatro módulos de interface
alterados, dois botões novos.

## Constitution Check

*GATE: precisa passar antes da Fase 0. Reavaliado depois da Fase 1.*

| Princípio | Verificação | Situação |
| --- | --- | --- |
| I. Ecossistema intocado | A 007 não chama o Core nem muda o adapter. Nenhum arquivo do meuPiá entra no repositório. A versão continua só em `src/config.js`. | ✅ |
| II. Portugol válido por construção | O gerador não muda. O painel mostra sempre `gerarPortugol(projeto).codigo`; o atualizador só decide **quando** gerar, nunca o texto. Blocos soltos continuam fora do texto (já garantido na 008). `blocosForaDoPrograma` é pura e determinística. | ✅ |
| III. Spec primeiro e rastreabilidade | Plan parte da spec 007 (RF-07). Tasks citam RF-07. Commits `007/Txxx (RF-07): …` e `docs(007) (RF-07): …`. O que depende de blocos reais fica registrado em "Pendências para as specs 002 e 003". | ✅ |
| IV. Testes e cobertura | `tempo-real.js` e `fora-do-programa.js` ficam em `src/portugol/` (já no `include` da cobertura), com testes de unidade. Nenhum Portugol novo é gerado, então nenhum caso de aceitação novo é exigido agora; os da 008 continuam passando. O caso de aceitação com blocos soltos entra com o primeiro bloco de comando real (pendência para a 002). `npm run cobertura` atualiza relatório e README na entrega. | ✅ |
| V. pt-BR e foco no iniciante | Botões "Desfazer" e "Refazer" e o aviso "Esta pilha está fora do programa" em pt-BR; os itens "Desfazer"/"Refazer" do menu do Blockly já vêm do pacote `pt-br`. O teste estático passa a recusar `Undo`/`Redo` no HTML. | ✅ |
| VI. Simplicidade de PoC | Zero dependências. Desfazer usa a pilha do Blockly em vez de um histórico próprio (R-05). Agrupamento por `requestAnimationFrame`, sem biblioteca de debounce. | ✅ |

**Resultado**: nenhuma violação. Tabela de complexidade vazia.

**Reavaliação após a Fase 1**: o desenho (data-model e contratos) mantém todos os
itens. Ponto de atenção: hoje só existe o bloco `programa`, então os cenários com
blocos reais (História 1, cenários 1, 2 e 4 com conteúdo; História 2; rolagem com
código longo) só podem ser vistos no navegador quando a 002 trouxer os primeiros
blocos. As regras estão cobertas por testes de unidade com o registro de teste; a
validação no navegador fica registrada como pendência (R-09), no mesmo modelo que a
001 usou para a 009.

## Estrutura do projeto

### Documentação (esta feature)

```text
specs/007-portugol-tempo-real/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Fase 0: inventário 001/008, eventos, arraste, soltos, desfazer, rolagem
├── data-model.md        # Fase 1: estado do atualizador, marcas, pilha de desfazer
├── quickstart.md        # Fase 1: validação no navegador e testes
├── contracts/
│   ├── tempo-real.md         # API pura do atualizador
│   ├── fora-do-programa.md   # API pura dos blocos soltos
│   └── editor.md             # interface: botões, marcas, rolagem, ganchos para 002/012
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; não criado aqui)
```

### Código-fonte (raiz do repositório)

Só arquivos novos (➕) ou alterados (✏️) por esta spec.

```text
index.html                    ✏️ botões Desfazer e Refazer no cabeçalho do painel Blocos
src/
├── estilos.css               ✏️ botões no cabeçalho do painel Blocos (mesmo estilo do "Copiar código")
├── main.js                   ✏️ liga o atualizador, as marcas de soltos e os botões; nome e Novo passam pelo atualizador
├── portugol/
│   ├── tempo-real.js         ➕ criarAtualizacaoTempoReal({ atualizar, agendar }) (núcleo)
│   └── fora-do-programa.js   ➕ blocosForaDoPrograma(blocos), MENSAGEM_FORA_DO_PROGRAMA (núcleo)
└── ui/                       # fora da cobertura
    ├── workspace.js          ✏️ ouvirEventos (troca aoMudar), desfazer, refazer, estadoDesfazer
    ├── avisos-ui.js          ✏️ aplicarAvisos(ws, avisos, chave): marcas por chave (incompleto × fora do programa)
    ├── painel-portugol.js    ✏️ mostrarCodigo mantém a rolagem e não reescreve texto igual
    └── barra-blocos.js       ➕ ligarBotoesDesfazer({ aoDesfazer, aoRefazer }), atualizarBotoesDesfazer(estado)

tests/unidade/
├── tempo-real.test.js            ➕ agrupamento, eventos de interface, arraste, solicitar, atualizarAgora
├── fora-do-programa.test.js      ➕ soltos, segundo programa, entrada malformada, ordem
├── tempo-real-cenarios.test.js   ➕ sequência de estados (encaixar, editar, soltar, reencaixar, desfazer) com o registro de teste
└── tela-estrutura.test.js        ✏️ botões Desfazer e Refazer; Undo/Redo na lista de palavras proibidas
```

**Decisão de estrutura**: mesma divisão da 008 e da 001. Toda regra com decisão
(quando gerar, o que é bloco solto) vai para `src/portugol/` e entra na cobertura; a
ligação com Blockly e DOM fica em `src/ui/`. Os dois módulos ficam em `src/portugol/`
porque tratam de **o que entra no Portugol e quando**, e já estão no `include` da
cobertura.

## O que a 001 e a 008 já entregam (sem duplicar)

| Já existe | Onde | Como a 007 usa |
| --- | --- | --- |
| `gerarPortugol(projeto)` puro, ignora blocos soltos | `src/portugol/gerador.js` (008) | Chamado pelo atualizador; FR-003 já atendido no texto. |
| Teste de 100 blocos no gerador | `tests/unidade/gerador.test.js` (008) | Base do SC-002 no núcleo; a 007 não repete. |
| Registro de blocos e bloco `programa` | `src/blocos/` (008) | `blocosForaDoPrograma` usa a mesma regra de raiz (primeiro `programa`). |
| `aoMudar(ws, cb)`: geração a cada evento não-UI | `src/ui/workspace.js` (008/001) | Substituído por `ouvirEventos`, que repassa também os eventos de arraste (R-02). |
| Regenerar ao digitar o nome | `src/main.js` (001, T015) | Passa a chamar `tempoReal.solicitar()`. |
| `mostrarCodigo(pre, codigo)` | `src/ui/painel-portugol.js` (001) | Ganha a rolagem mantida (R-06). |
| `aplicarAvisos(ws, avisos)` | `src/ui/avisos-ui.js` (008) | Ganha o parâmetro `chave`, para as marcas de soltos não apagarem as de incompletos (R-04). |
| `recarregarBlocos` com `clearUndo` | `src/ui/workspace.js` (001, T014) | Novo (e 012) seguem zerando o desfazer; os botões ficam desabilitados depois. |
| Pilha de desfazer do Blockly, atalhos e menu em pt-BR | Blockly 12 + `blockly/msg/pt-br` | Base do FR-006; a 007 só acrescenta os botões (R-05). |

## Sequência e dependências com as outras specs

| Entrega desta feature | Usada por | Observação |
| --- | --- | --- |
| `tempoReal.solicitar()` | 002 | Criar, renomear e apagar variável muda `projeto.variaveis` fora do Blockly; a 002 chama `solicitar()` depois de cada mudança (FR-001). |
| `tempoReal.atualizarAgora()` | 012 | Depois de carregar (`recarregarBlocos`), gera na hora, antes de marcar a referência (caso de borda "Carregar"). |
| Marca "fora do programa" | 002–006 | Vale para qualquer bloco novo sem código extra: a regra olha só o topo do workspace. |
| Botões Desfazer/Refazer | 002 | A 002 decide se criar/renomear/apagar variável entra na pilha de desfazer (pendência abaixo). |

## Pendências para as specs 002 e 003

Hoje só existe o bloco `programa` (não apagável e sem campos). Por isso:

- **Validação no navegador com blocos reais** — História 1 cenários 1, 2 e 4 com
  conteúdo, História 2 inteira, rolagem mantida com Portugol longo (FR-005) e
  programa de 100 blocos (SC-002) — entra no quickstart da **002** (primeiros blocos
  de comando e valor) e é repetida na **003** com o `escreva` exato dos cenários da
  spec. Os passos estão prontos no [quickstart.md](quickstart.md), seção "Depois da
  002".
- **Caso de aceitação com bloco solto** (`tests/aceitacao/casos/`): entra na 002, com
  um bloco de comando real solto fora do `programa`, conferindo que o Portugol roda no
  Core sem ele.
- **Variáveis e tempo real**: a 002 chama `tempoReal.solicitar()` em toda mudança de
  `projeto.variaveis` e decide se essas mudanças entram no desfazer (FR-006 fala de
  "alterações nos blocos"; ver R-05).

## Acompanhamento de complexidade

Nenhuma violação da constitution a justificar.
