# Plano de implementação: Portugol válido para o Core

**Branch**: `008-portugol-valido` | **Data**: 2026-11-08 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/008-portugol-valido/spec.md` (RF-08 · RNF-07)

**Papel especial deste plan**: a 008 é a primeira spec implementada (ordem em
[specs/README.md](../README.md)). Além do RF-08, este plan **cria a base do projeto**
que todas as outras specs usam: Vite + JavaScript (ES Modules), Blockly, Pyodide com
`meupia-core` 1.4.1, Vitest com cobertura v8 e a suíte de aceitação que roda o
Portugol gerado no Core real.

## Resumo

O gerador de Portugol é uma **função pura** `gerarPortugol(projeto) → { codigo, avisos }`
que recebe o projeto serializado (nome, variáveis e a serialização JSON do Blockly) e
devolve o texto e a lista de avisos de blocos incompletos. Ele não importa o Blockly
nem toca o DOM: percorre a árvore JSON a partir do bloco raiz `programa` e chama, para
cada tipo de bloco, um gerador registrado num **registro de blocos**. Esta feature
entrega a estrutura (`algoritmo` / `var` / `inicio` / `fim_algoritmo`), a indentação
de 4 espaços, o nome do programa saneado, o mecanismo de avisos com marcador `???` e
o bloqueio de execução. Os blocos de comando e de expressão chegam nas specs 002–006,
cada um registrando seu gerador e seus casos de aceitação.

A aceitação roda no **mesmo motor do navegador**: o pacote npm `pyodide` (0.25.0, a
versão do meuPiá Lab) carregado no Node pelo Vitest instala `meupia-core==1.4.1` via
micropip e executa o mesmo adapter (`src/core/`) que o navegador usa. Um spike feito
neste plan confirmou que o fluxo funciona no Node 24 (ver [research.md](research.md), R-03).

## Contexto técnico

**Linguagem/Versão**: JavaScript ES2022 (ES Modules), Node.js ≥ 20 para ferramentas e
testes (validado no Node 24). O Python roda dentro do Pyodide 0.25.0 (CPython 3.11).

**Dependências principais** (justificativas em research.md, R-07):
- `blockly`: editor de blocos (D-02).
- `pyodide` 0.25.0: Python em WebAssembly no navegador e no Node (D-03).
- `meupia-core` 1.4.1: instalado em tempo de execução pelo micropip, a partir do PyPI.
  Não entra no `package.json`.
- Desenvolvimento: `vite`, `vitest`, `@vitest/coverage-v8`.

**Armazenamento**: nenhum servidor. Projetos em arquivo `.json` local (specs 011/012);
o formato v1 é fixado aqui porque os casos de aceitação o usam (ver data-model.md).

**Testes**: Vitest com dois projetos: `unidade` (Node puro, rápido) e `aceitacao`
(Pyodide + Core real, um único worker). Cobertura v8 sobre o núcleo da lógica.

**Plataforma-alvo**: navegadores modernos (Chrome, Firefox, Edge atuais), 100% no
cliente (RNF-06). Site estático gerado pelo `vite build`.

**Tipo de projeto**: aplicação web estática de página única (sem backend).

**Metas de desempenho**: gerar o Portugol de um programa de 100 blocos em < 50 ms
(folga para o limite de 1 s da spec 007). Carregar Pyodide + Core no Node: ~5 s por
execução da suíte de aceitação (medido: 4,5 s).

**Restrições**: o gerador não depende de DOM, relógio, aleatoriedade nem estado global
(princípio II); a versão do Core fica num único ponto (`src/config.js`); a suíte de
aceitação precisa de internet na primeira execução (PyPI e CDN do Pyodide).

**Escala/Escopo**: PoC do escopo mínimo (RF-01 a RF-12); dezenas de tipos de bloco;
programas de até algumas centenas de blocos.

## Constitution Check

*GATE: precisa passar antes da Fase 0. Reavaliado depois da Fase 1.*

| Princípio | Verificação | Situação |
| --- | --- | --- |
| I. Ecossistema intocado | O Core é instalado do PyPI (`meupia-core==1.4.1`) e chamado só por `meuPia.compiler.main(arquivo, saida)`, igual ao Lab. Nenhum arquivo do meuPiá é copiado: o spike leu o pacote fora do repositório. A versão fica só em `src/config.js`; um teste verifica que ela não aparece em outro arquivo de código ou configuração. A lacuna "não há função que compile um texto sem arquivo" é resolvida no adapter (escreve `main.por` no FS virtual) e vira issue no repositório `meuPia/core` (R-09). | ✅ |
| II. Portugol válido por construção | `gerarPortugol` é pura e determinística, sobre o projeto serializado. Estrutura e indentação de 4 espaços fixadas no contrato. Blocos incompletos geram aviso e marcador `???`, e a execução fica bloqueada (o texto com `???` nunca chega ao Core). | ✅ |
| III. Spec primeiro e rastreabilidade | O plan parte da spec 008 (RF-08, RNF-07). As tasks citam RF-08/RNF-07 e, nas tasks de base, os RNF que atendem (RNF-02, RNF-04, RNF-06). Commits no formato `T0xx (RF-08): …`. | ✅ |
| IV. Testes e cobertura | Cobertura v8 ≥ 80% em linhas e branches sobre `src/portugol/`, `src/blocos/`, `src/projeto/` e `src/core/`, com `src/ui/` e `src/main.js` excluídos na configuração. Aceitação com o Core real (sem mock). Relatório versionado em `cobertura/`. README atualizado por script. `thresholds` do Vitest falham a suíte abaixo de 80%. | ✅ |
| V. pt-BR e foco no iniciante | Avisos em pt-BR no formato "Falta a condição do bloco se". Nomes de módulos, funções e mensagens em português. Erros do Core vêm do adapter já separados em mensagem e detalhe técnico. | ✅ |
| VI. Simplicidade de PoC | Cinco dependências, todas justificadas (R-07). Sem backend, sem framework de UI, sem jsdom (o gerador não precisa de DOM; o Blockly roda headless no Node para testar definições de bloco). | ✅ |

**Resultado**: nenhuma violação. Tabela de complexidade vazia.

**Reavaliação após a Fase 1**: o desenho (data-model, contratos) mantém todos os itens
acima. Ponto de atenção registrado: a suíte de aceitação depende de rede (PyPI/CDN).
Isso não viola o princípio IV, mas está documentado no quickstart e em R-04.

## Estrutura do projeto

### Documentação (esta feature)

```text
specs/008-portugol-valido/
├── plan.md              # este arquivo
├── research.md          # Fase 0: decisões e achados no Core 1.4.1
├── data-model.md        # Fase 1: projeto, blocos, avisos, caso de aceitação
├── quickstart.md        # Fase 1: como validar a feature
├── contracts/
│   ├── gerador-portugol.md     # API do gerador, formato do texto, avisos
│   ├── registro-blocos.md      # como as specs 002–006 plugam seus blocos
│   ├── executor-core.md        # adapter do Core (navegador e Node)
│   └── caso-aceitacao.schema.json
└── tasks.md             # Fase 2 (/speckit-tasks; não criado aqui)
```

### Código-fonte (raiz do repositório)

```text
index.html                    # página única (os três painéis chegam na spec 001)
package.json                  # scripts: dev, build, test, test:unidade, test:aceitacao, cobertura, readme
vite.config.js                # build + configuração do Vitest (projetos unidade/aceitacao, cobertura)
src/
├── config.js                 # ÚNICO ponto da versão do Core (MEUPIA_CORE_VERSAO)
├── main.js                   # bootstrap da página (fora da cobertura)
├── portugol/                 # núcleo puro, sem Blockly e sem DOM
│   ├── gerador.js            # gerarPortugol(projeto) → { codigo, avisos }
│   ├── emissor.js            # acumula linhas com indentação de 4 espaços
│   ├── nome-programa.js      # sanearNomePrograma(nome)
│   ├── variaveis.js          # seção var (ordem por tipo e criação)
│   ├── avisos.js             # criarAviso, MARCADOR_AUSENTE = '???'
│   └── execucao.js           # verificarExecucao(resultado) → bloqueio por avisos
├── blocos/
│   ├── registro.js           # registro tipo de bloco → { definicao, gerar }
│   └── programa.js           # bloco raiz "programa" (hat, não apagável)
├── projeto/
│   └── formato.js            # constantes do arquivo v1 (formato, versao) e projetoVazio()
├── core/
│   ├── ponte-python.js       # código Python do adapter (string), igual no navegador e no Node
│   ├── executor-core.js      # compilarEExecutar(motor, codigo, entrada) → resultado
│   └── motor-navegador.js    # carrega Pyodide do CDN + micropip (fora da cobertura)
└── ui/                       # integração com Blockly e DOM (fora da cobertura)
    └── avisos-ui.js          # marca blocos, lista avisos, destaca ao clicar

tests/
├── unidade/                  # gerador, nome, var, avisos, registro, determinismo, versão única
├── aceitacao/
│   ├── casos/*.json          # projeto + entrada + saída esperada (schema em contracts/)
│   ├── suporte/motor-node.js # carrega o pacote npm pyodide + micropip no Node
│   └── aceitacao.test.js     # para cada caso: gerar → compilar → executar → comparar
└── auxiliares/blocos-teste.js # blocos falsos de comando/expressão, só para testar indentação

cobertura/                    # relatório versionado (json-summary + html)
scripts/atualizar-readme.mjs  # escreve "N testes · X% de cobertura" no topo do README
```

**Decisão de estrutura**: projeto único, estático, com o núcleo (`portugol/`,
`blocos/`, `projeto/`, `core/`) separado da interface (`ui/`, `main.js`). Assim o
núcleo é medido pela cobertura e testado sem navegador, e a interface fica fora da
medição, como permite a constitution (princípio IV).

## Sequência e dependências com as outras specs

| Entrega desta feature | Usada por | Observação |
| --- | --- | --- |
| Base do projeto (Vite, Vitest, cobertura, README, `config.js`) | todas | Primeira task (setup). |
| `gerarPortugol` + emissor + registro + bloco `programa` | 002–007 | Cada spec de bloco só registra `{definicao, gerar}` e adiciona casos de aceitação. |
| Seção `var` a partir de `projeto.variaveis` | 002 | 002 cria/renomeia/apaga variáveis; a 008 só as declara. |
| Avisos + marcador + `verificarExecucao` | 004, 005, 006, 009 | 004–006 declaram as partes obrigatórias dos seus blocos; 009 chama `verificarExecucao` antes de rodar. |
| Adapter do Core (`executor-core.js`, `ponte-python.js`) | 009, 010 | 009 liga ao botão Executar e ao Parar (worker); 010 liga o `stdin` à caixa de entrada. |
| Formato de arquivo v1 (`formato.js`) | 011, 012 | 011 grava, 012 valida e carrega. |
| `avisos-ui.js` (História 2, cenários 2 e 3) | 001, 009 | Precisa dos painéis (001) e do botão Executar (009). As tasks dessa parte ficam marcadas como dependentes e são concluídas quando a 001 estiver pronta. O comportamento testável (lista ordenada, bloqueio) já fica no núcleo. |

**Cobertura de SC-002 de forma progressiva**: um teste de meta-aceitação verifica que
**todo tipo de bloco registrado** aparece em pelo menos um caso de aceitação. Na 008
só existe o bloco `programa`; cada spec 002–006 que registra blocos precisa trazer os
seus casos, senão a suíte falha. Ao fim do ciclo isso garante o SC-002.

## Acompanhamento de complexidade

Nenhuma violação da constitution a justificar.
