# Plano de implementação: Salvar projeto em JSON

**Branch**: `011-salvar-projeto` | **Data**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/011-salvar-projeto/spec.md` (RF-11), com três
orientações: (1) o arquivo é o formato `meupia-blocos` com versão e guarda tudo que as
specs anteriores criaram (nome, variáveis com tipo e ordem de criação da 002, blocos de
todas as categorias, o senão ligado/desligado da 004 e o número de valores do escreva da
003); (2) Salvar marca o projeto como sem alterações não salvas, usado pelo Novo (001,
FR-007); (3) reaproveitar `src/projeto/formato.js` e `src/projeto/alteracoes.js`.

**Ponto de partida**: `formato.js` (constantes e `projetoVazio`) e `alteracoes.js`
(`assinaturaProjeto`, `haAlteracoes`) **já existem** e são usados pelo Novo; `main.js` já
monta o projeto completo em `projetoAtual()` e guarda `referencia`. Inventário em
[research.md](research.md), R-01.

## Resumo

1. **Arquivo v1** (R-02, R-04; FR-002): `formato.js` ganha `montarArquivo` e
   `textoArquivo`; o arquivo é o Projeto v1 da 008 com as chaves `formato`, `versao`,
   `nome`, `variaveis`, `blocos`, em JSON indentado. Tudo vem de `projetoAtual()`: a
   serialização do Blockly já leva `extraState` do escreva (`valores`) e do se (`senao`),
   posições, blocos soltos e incompletos; `variaveis` já sai na ordem de criação por tipo.
2. **Nome do arquivo** (R-05; FR-003): `nomeArquivo` em `src/projeto/salvar.js` troca
   `/ \ : * ? " < > |` e controles por `_`; vazio vira `MeuPrograma.json`.
3. **Download local** (R-06; FR-001, FR-004): `src/ui/download.js` com `Blob` e
   `<a download>`; nenhuma rede.
4. **Referência de salvo** (R-07; FR-005; 001 FR-007): `prepararSalvamento` devolve
   também `assinaturaProjeto(p)`; o `main.js` guarda em `referencia`, e o Novo deixa de
   pedir confirmação até a próxima alteração. `alteracoes.js` não muda.
5. **Alterações não salvas** (R-08; FR-006, História 2): indicador "alterações não
   salvas" ao lado do nome, atualizado a cada geração; `beforeunload` pede confirmação.
6. **Testes** (R-09; SC-001 a SC-003): unidade para o núcleo, ida e volta headless com
   todos os tipos registrados, aceitação que passa cada caso pelo caminho do Salvar e
   executa no `meupia-core` real.

## Contexto técnico

**Linguagem/Versão**: JavaScript ES2022 (ES Modules). Node.js ≥ 20 para ferramentas e
testes.

**Dependências principais**: as mesmas (`blockly` 12.5.1, `pyodide` 0.25.0; `vite`,
`vitest`, `@vitest/coverage-v8` em dev). **Nenhuma dependência nova** (R-10).

**Armazenamento**: arquivo `.json` baixado no computador do estudante; formato v1 da 008
sem mudança ([data-model.md](data-model.md)). Nada no navegador (sem `localStorage`).

**Testes**: Vitest.

- `unidade`: `formato.test.js` (acréscimos), `salvar.test.js` (novo),
  `salvar-blockly.test.js` (novo, headless), `tela-estrutura.test.js` (botão e indicador).
- `aceitacao`: `salvar.test.js` (novo), sobre todos os casos de `tests/aceitacao/casos/`.
- Download real, indicador, Novo sem confirmação e `beforeunload`: [quickstart.md](quickstart.md).

**Plataforma-alvo**: Chrome, Firefox e Edge em notebook/desktop.

**Tipo de projeto**: aplicação web estática de página única, sem backend (RNF-06).

**Metas de desempenho**: Salvar em menos de 1 s com até 100 blocos (SC-002); o indicador
custa um `JSON.stringify` por geração.

**Restrições**:

- O que decide o conteúdo do arquivo é puro e fica em `src/projeto/` (princípio IV).
- Salvar não muda o projeto aberto (FR-005): sem `recarregarBlocos`, sem limpar o desfazer.
- O diálogo do `beforeunload` é do navegador (texto não configurável).

**Escala/Escopo**: um módulo novo no núcleo (`src/projeto/salvar.js`), um alterado
(`src/projeto/formato.js`); um novo na interface (`src/ui/download.js`), três alterados
(`src/ui/barra.js`, `src/ui/textos.js`, `src/main.js`), mais `index.html` e `estilos.css`.

## Constitution Check

*GATE: precisa passar antes da Fase 0. Reavaliado depois da Fase 1.*
Constitution v2.0.0.

| Princípio | Verificação | Situação |
| --- | --- | --- |
| I. Ecossistema intocado | Nada do Core é usado no Salvar; a aceitação usa o `meupia-core` pelo adapter existente. Versão só em `src/config.js`. | ✅ |
| II. Portugol válido por construção | O gerador não muda. O arquivo guarda o projeto, não o Portugol; a ida e volta garante o mesmo texto (SC-001). Blocos incompletos são salvos como estão e continuam gerando aviso. | ✅ |
| III. Spec primeiro e rastreabilidade | Plan parte da spec 011 (RF-11) e cita a 001 (FR-007), 002, 003, 004 e 008 nos pontos reaproveitados. Commits por fase `011/Txxx-Tyyy (RF-11[, RF-01]): …` e `docs(011) (RF-11): …`. | ✅ |
| IV. Testes e cobertura | "Serialização de projeto" está no núcleo medido: `formato.js` e `salvar.js` em `src/projeto/**`. Aceitação com o Core real a partir dos casos em JSON, passando pelo caminho do Salvar. Só `download.js`, `barra.js` e `main.js` ficam fora (exclusão já declarada). | ✅ |
| V. pt-BR e foco no iniciante | Indicador, dica e todos os textos do editor em pt-BR. **Exceção registrada**: o texto da confirmação ao fechar ou recarregar a aba (`beforeunload`) é do navegador, no idioma dele (R-08). Justificada na tabela de complexidade. | ⚠️ exceção justificada |
| VI. Simplicidade de PoC | Zero dependências; sem backend, sem salvamento automático ou na nuvem (Premissas); `<a download>` em vez da File System Access API (R-06). | ✅ |

**Resultado**: uma exceção ao princípio V, justificada em "Acompanhamento de complexidade". Nenhuma outra violação.

**Reavaliação após a Fase 1**: o desenho mantém todos os itens. Pontos de atenção:

1. Se o navegador perguntar onde salvar e o estudante cancelar, o projeto fica marcado
   como salvo (R-06). Aceito na PoC; documentado.
2. O `beforeunload` mostra o texto padrão do navegador, no idioma dele (R-08); exceção ao
   princípio V registrada na tabela de complexidade.
3. `nome` é gravado bruto (como digitado): o saneamento continua no gerador, e a 012
   devolve ao campo o mesmo texto (feito: `lerArquivo` não apara nem saneia).
4. O se sem senão é gravado sem `extraState` (o mutador devolve `null`); a 012 trata
   ausente como "desligado" (feito: `validarBlocos` aceita ausente, `{ senao: true }` e
   `{ senao: false }`).
5. A ida e volta foi provada aqui com `workspaces.load` + `blocosComVariaveis`; a 012 usa o
   mesmo caminho (`recarregarBlocos`), lê o arquivo com `lerArquivo` em `formato.js` e marca
   a referência depois da carga ([plan da 012](../012-carregar-projeto/plan.md)).

## Estrutura do projeto

### Documentação (esta feature)

```text
specs/011-salvar-projeto/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Fase 0: inventário, conteúdo, nome, download, referência, indicador
├── data-model.md        # Fase 1: arquivo v1, estado por spec, referência de salvo
├── quickstart.md        # Fase 1: validação nos testes e no navegador
├── contracts/
│   ├── salvar.md        # núcleo: montarArquivo, textoArquivo, nomeArquivo, prepararSalvamento
│   └── tela-salvar.md   # interface: botão, indicador, download, beforeunload, main.js
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; não criado aqui)
```

### Código-fonte (raiz do repositório)

Só arquivos novos (➕) ou alterados (✏️) por esta spec.

```text
index.html                     ✏️ botão Salvar habilitado; span #indicador-alteracoes
src/
├── projeto/
│   ├── formato.js             ✏️ montarArquivo, textoArquivo (reaproveitado)
│   ├── alteracoes.js          — sem mudança (reaproveitado: assinaturaProjeto, haAlteracoes)
│   └── salvar.js              ➕ nomeArquivo, prepararSalvamento (núcleo)
├── ui/
│   ├── download.js            ➕ baixarArquivo (Blob + <a download>)
│   ├── barra.js               ✏️ aoSalvar, mostrarAlteracoes
│   └── textos.js              ✏️ alteracoesNaoSalvas, salvarDica
├── estilos.css                ✏️ estilo do indicador
└── main.js                    ✏️ salvarProjeto, indicador, beforeunload
tests/
├── unidade/
│   ├── formato.test.js        ✏️ montarArquivo, textoArquivo
│   ├── salvar.test.js         ➕ nomeArquivo, prepararSalvamento, sem rede, 100 blocos
│   ├── salvar-blockly.test.js ➕ ida e volta headless com todos os tipos
│   └── tela-estrutura.test.js ✏️ botão Salvar, indicador, textos
└── aceitacao/
    └── salvar.test.js         ➕ cada caso pelo caminho do Salvar → Core real
README.md                      ✏️ linha de testes e cobertura
cobertura/                     ✏️ relatório versionado
```

**Decisão de estrutura**: mesma árvore das specs anteriores; o núcleo do Salvar fica em
`src/projeto/` ao lado do formato e das alterações, e a interface em `src/ui/`.

## Rastreabilidade

| Requisito | Onde |
| --- | --- |
| FR-001 | `prepararSalvamento`, `baixarArquivo`, `salvarProjeto` |
| FR-002 | `montarArquivo`, `textoArquivo`; testes de ida e volta |
| FR-003 | `nomeArquivo` |
| FR-004 | `download.js` (Blob); teste sem rede |
| FR-005 | `montarArquivo` copia; `salvarProjeto` não recarrega |
| FR-006 | indicador, `beforeunload` |
| 001 FR-007 | `referencia` atualizada pelo Salvar |
| SC-001 | `salvar-blockly.test.js`, `tests/aceitacao/salvar.test.js` |
| SC-002 | teste de 100 blocos |
| SC-003 | `textoArquivo` indentado; quickstart passo 5 |

## Acompanhamento de complexidade

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
| --- | --- | --- |
| Princípio V (interface em pt-BR): a confirmação ao fechar ou recarregar a aba mostra o texto do navegador, no idioma dele. | O FR-006 exige pedir confirmação ao fechar ou recarregar com alterações não salvas. O evento `beforeunload` é a única forma de uma página fazer isso, e os navegadores não deixam trocar o texto desde 2016 (research R-08). O resto do aviso, a indicação "alterações não salvas" na barra, é do editor e está em pt-BR. | Um diálogo próprio em pt-BR é impossível: a página não controla o fechamento da aba. Não pedir confirmação (só a indicação na barra) deixaria o FR-006 sem cumprir. |
