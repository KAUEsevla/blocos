# Plano de implementação: Tela de três painéis

**Branch**: `001-tela-tres-paineis` | **Data**: 2026-11-14 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/001-tela-tres-paineis/spec.md` (RF-01 · RNF-03)

**Ponto de partida**: a base do projeto já existe (spec 008, integrada na `main`).
Este plan **reaproveita** a estrutura (`src/portugol/`, `src/blocos/`, `src/projeto/`,
`src/core/`, `src/ui/`), o registro de blocos, o gerador `gerarPortugol` e o adapter
do Core. Nenhum módulo do núcleo muda de contrato. A 001 troca a página provisória da
008 (`index.html` com dois elementos soltos) pela tela definitiva.

## Resumo

A tela vira uma página com uma **barra superior** (campo "Nome do programa" e os botões
Executar, Salvar, Carregar e Novo) e **três painéis** lado a lado, na ordem Blocos →
Portugol → Saída, cada um com título e rolagem própria. O layout é CSS Grid puro: três
colunas a partir de 1024 px e uma coluna empilhada abaixo disso. O painel Portugol é um
`<pre>` (somente leitura por natureza) com o botão "Copiar código", que usa a Clipboard
API com plano B por seleção de texto. O painel Saída ganha uma API pequena
(`criarPainelSaida`) que as specs 009 e 010 vão usar.

A ação **Novo** é a única que funciona de ponta a ponta nesta spec. Ela depende de saber
se há "alterações não salvas", e essa regra vai para o núcleo como **função pura**
(`src/projeto/alteracoes.js`, dentro da cobertura): compara a assinatura canônica do
projeto atual com a de uma referência (o projeto novo agora, o salvo na 011 e o
carregado na 012). A confirmação usa um `<dialog>` próprio com botões em pt-BR, e não o
`window.confirm`, cujos botões seguem o idioma do navegador (SC-003). Executar, Salvar
e Carregar aparecem na posição final, desabilitados, até as specs 009, 011 e 012.

O **bloqueio do Executar com lista de avisos** (pendência de tela da 008) **fica para a
009**. A 001 entrega o que ela precisa (o painel Saída e a sua API), e o motivo está em
[research.md](research.md), R-01.

## Contexto técnico

**Linguagem/Versão**: JavaScript ES2022 (ES Modules), HTML e CSS. Node.js ≥ 20 para
ferramentas e testes, como na 008.

**Dependências principais**: as mesmas da 008 (`blockly` 12.5.1, `pyodide` 0.25.0;
`vite`, `vitest`, `@vitest/coverage-v8` em dev). **Nenhuma dependência nova**: layout em
CSS Grid, diálogo em `<dialog>` nativo, cópia pela Clipboard API (R-07).

**Armazenamento**: nenhum. A referência de "não salvo" vive só na memória da página.

**Testes**: Vitest, projeto `unidade`. Novos testes do núcleo para `alteracoes.js` e um
teste estático da estrutura de `index.html` (ids, títulos, rótulos, `lang`), sem jsdom.
O comportamento visual (layout, rolagem, diálogo, cópia) é verificado no navegador pelo
[quickstart.md](quickstart.md) (R-08).

**Plataforma-alvo**: navegadores modernos de notebook/desktop (Chrome, Firefox, Edge
atuais). Celular fora do escopo (premissa da spec).

**Tipo de projeto**: aplicação web estática de página única, sem backend (RNF-06).

**Metas de desempenho**: sem meta nova. Calcular a assinatura do projeto a cada mudança
custa o mesmo que serializar o workspace, que a 008 já faz para gerar o Portugol.

**Restrições**: largura mínima suportada de 1024 px para os três painéis lado a lado
(SC-001); todo texto em pt-BR (FR-003, SC-003); `src/ui/` e `src/main.js` seguem fora da
cobertura (princípio IV), então toda regra testável vai para o núcleo.

**Escala/Escopo**: uma tela, cinco controles na barra, três painéis, um diálogo.

## Constitution Check

*GATE: precisa passar antes da Fase 0. Reavaliado depois da Fase 1.*

| Princípio | Verificação | Situação |
| --- | --- | --- |
| I. Ecossistema intocado | A 001 não chama o Core e não muda o adapter. Nenhum arquivo do meuPiá entra no repositório. A versão continua só em `src/config.js`, e o teste `versao-unica.test.js` já cobre `index.html` e `src/`. | ✅ |
| II. Portugol válido por construção | O gerador não muda. O painel Portugol só exibe `resultado.codigo` e é somente leitura (FR-004), então o texto mostrado é sempre o gerado pelos blocos. O nome digitado passa por `sanearNomePrograma` dentro do gerador, como na 008. | ✅ |
| III. Spec primeiro e rastreabilidade | Plan parte da spec 001 (RF-01, RNF-03). As tasks citam RF-01 (e RNF-03 nas de texto). Commits `001/Txxx (RF-01): …` e `docs(001) (RF-01): …`. A pendência de tela da 008 segue registrada para a 009 (seção "Pendências para a spec 009"). | ✅ |
| IV. Testes e cobertura | `src/projeto/alteracoes.js` fica dentro da cobertura, com testes de unidade. `src/ui/` continua excluído por declaração no `vite.config.js`. Nenhum teste de aceitação novo é exigido (a 001 não gera Portugol novo), e os da 008 continuam passando. Relatório e README atualizados por `npm run cobertura` na entrega. | ✅ |
| V. pt-BR e foco no iniciante | Todos os textos da tela ficam em `index.html` e em `src/ui/textos.js`, em pt-BR. O diálogo de confirmação é próprio para não depender do idioma do navegador (R-04). O teste estático confere os rótulos exigidos pela spec. | ✅ |
| VI. Simplicidade de PoC | Zero dependências novas (R-07). Sem framework de UI: HTML estático + módulos pequenos. Executar, Salvar e Carregar ficam só posicionados; o comportamento é das specs 009, 011 e 012. | ✅ |

**Resultado**: nenhuma violação. Tabela de complexidade vazia.

**Reavaliação após a Fase 1**: o desenho (data-model e contratos) mantém todos os itens.
Ponto de atenção: a verificação visual é manual (quickstart), porque a interface está fora
da cobertura e não há ferramenta de teste de navegador no projeto. Isso é permitido pelo
princípio IV e está justificado em R-08.

## Estrutura do projeto

### Documentação (esta feature)

```text
specs/001-tela-tres-paineis/
├── plan.md              # este arquivo
├── research.md          # Fase 0: decisões de layout, cópia, confirmação, avisos
├── data-model.md        # Fase 1: projeto aberto, referência, estado da tela
├── quickstart.md        # Fase 1: como validar a tela no navegador
├── contracts/
│   ├── tela.md              # estrutura da página: ids, rótulos, estados, layout
│   ├── alteracoes.md        # API pura de "alterações não salvas"
│   └── painel-saida.md      # API do painel Saída para as specs 009 e 010
└── tasks.md             # Fase 2 (/speckit-tasks; não criado aqui)
```

### Código-fonte (raiz do repositório)

Só arquivos novos (➕) ou alterados (✏️) por esta spec; o resto é da 008 e não muda.

```text
.gitignore                    ✏️ ignora .vite/ (cache do Vite/Vitest)
index.html                    ✏️ barra + três painéis + <dialog> de confirmação
src/
├── estilos.css               ➕ layout em CSS Grid, rolagem por painel, empilhamento < 1024 px
├── main.js                   ✏️ monta a tela: projeto aberto, barra, painéis, Novo
├── projeto/
│   └── alteracoes.js         ➕ assinaturaProjeto, haAlteracoes (núcleo, dentro da cobertura)
└── ui/                       # fora da cobertura
    ├── textos.js             ➕ textos da tela em pt-BR (orientação, cópia, diálogo, dicas)
    ├── workspace.js          ✏️ + recarregarBlocos(ws, blocos) e redimensionamento do Blockly
    ├── painel-portugol.js    ➕ mostrarCodigo, copiarCodigo (Clipboard API + plano B)
    ├── painel-saida.js       ➕ criarPainelSaida(elemento): limpar, mostrarOrientacao, escrever, areaAvisos
    ├── barra.js              ➕ liga o campo "Nome do programa" e os quatro botões
    └── confirmacao.js        ➕ confirmar({ titulo, mensagem, confirmar, cancelar }) → Promise<boolean>

tests/unidade/
├── alteracoes.test.js        ➕ assinatura canônica e comparação
└── tela-estrutura.test.js    ➕ lê index.html como texto: lang, ids, títulos, rótulos, ordem
```

**Decisão de estrutura**: mesma divisão da 008: regra no núcleo (testada e medida),
DOM e Blockly em `src/ui/` (fora da medição). A única regra nova com lógica, "há
alterações não salvas?", fica em `src/projeto/` porque as specs 011 e 012 também a
usam (atualizar a referência ao salvar e ao carregar).

## Sequência e dependências com as outras specs

| Entrega desta feature | Usada por | Observação |
| --- | --- | --- |
| Barra com o campo "Nome do programa" | 007, 011 | O campo alimenta `projeto.nome`; o gerador já saneia. A 007 cuida do "tempo real" completo. |
| Botão Executar (posição, desabilitado) | 009 | A 009 habilita, liga a execução, o bloqueio por avisos e o botão Parar. |
| Botões Salvar e Carregar (posição, desabilitados) | 011, 012 | Cada spec habilita o seu e, depois de salvar/carregar, atualiza a referência com `assinaturaProjeto` (data-model). |
| `criarPainelSaida` (contrato `painel-saida.md`) | 009, 010 | 009 escreve linhas e mensagens de fim; 010 coloca a caixa de entrada no painel. |
| `alteracoes.js` (`assinaturaProjeto`, `haAlteracoes`) | 011, 012 | Novo usa agora; Salvar e Carregar atualizam a referência. |
| `confirmar(...)` | 012 | Carregar com alterações não salvas pode reaproveitar o mesmo diálogo. |

## Pendências para a spec 009

A parte de tela dos cenários 2 e 3 da História 2 da 008 (Executar não começa com blocos
incompletos, a Saída lista os avisos, clicar no aviso destaca o bloco) **continua na
009**, como já registrado em "Pendências para a spec 009" no
[tasks.md da 008](../008-portugol-valido/tasks.md) e na matriz de
[specs/README.md](../README.md). Motivo em [research.md](research.md), R-01. O que a 001
deixa pronto para isso:

- o painel Saída com `limpar()`, `escrever(texto, 'sistema')` e a área `areaAvisos`, onde
  a 009 chama `renderizarAvisos(saida.areaAvisos, avisos, aoClicar)` (contrato
  [painel-saida.md](contracts/painel-saida.md));
- o botão Executar com id `botao-executar`, no lugar definitivo.

## Acompanhamento de complexidade

Nenhuma violação da constitution a justificar.
