# Constituição do meuPiá Blocos

O meuPiá Blocos é o editor de programação por blocos do ecossistema meuPiá: o
iniciante monta o programa com blocos, vê o Portugol nascer em tempo real ao lado e o
executa pelo meuPiá Core, tudo 100% no navegador. Fontes desta constituição:
`docs/briefing/01-briefing-trilha-1.md`, `docs/briefing/02-requisitos-extraidos.md` e
`CONTRIBUTING.md`.

## Princípios Fundamentais

### I. Ecossistema intocado (NÃO NEGOCIÁVEL)

- O Core e os módulos do meuPiá DEVEM ser consumidos apenas pelas interfaces públicas:
  o pacote `meupia-core` publicado no PyPI, a função `meuPia.compiler.main` e os
  pacotes `mpgp`.
- Nenhum arquivo do meuPiá PODE ser copiado para este repositório ou modificado.
- Toda lacuna encontrada DEVE virar uma issue no repositório do módulo correspondente
  e ser resolvida com um adapter do lado do editor, isolado e testado.
- A versão do Core DEVE ser fixada num único ponto de configuração do projeto. Hoje a
  versão é `meupia-core==1.4.1`, a tag congelada da turma. Nenhum outro arquivo PODE
  repetir o número da versão.

**Motivo:** o editor é um consumidor do ecossistema, não um fork dele. Manter o Core
intocado garante que o Portugol gerado aqui roda igual no meuPiá Lab e nos demais
produtos, e que a avaliação usa a mesma versão para toda a turma (RNF-01, RNF-02).

### II. Portugol válido por construção

- Todo programa montado com blocos DEVE gerar Portugol aceito pelo parser do Core na
  versão fixada.
- O gerador DEVE ser uma função pura (workspace serializado → texto), determinística:
  a mesma entrada produz sempre o mesmo texto, sem depender de DOM, relógio ou estado
  global.
- O texto gerado DEVE usar indentação de 4 espaços e a estrutura
  `algoritmo "Nome"` / `var` / `inicio` / `fim_algoritmo`.
- Blocos incompletos (encaixes vazios, variável não escolhida) NÃO PODEM quebrar a
  geração: DEVEM virar código seguro (valor padrão neutro) ou um aviso visível ao
  usuário.

**Motivo:** o valor do editor está em mostrar Portugol correto ao iniciante. Uma função
pura e determinística é testável sem navegador e sustenta os testes de aceitação
(RF-07, RF-08, RNF-07).

### III. Spec primeiro e rastreabilidade

- Nada é implementado sem spec, plan e task aprovados.
- Requisitos DEVEM ter IDs (`RF-xx`, `RNF-xx`), definidos em
  `docs/briefing/02-requisitos-extraidos.md` e referenciados pelas specs.
- Cada task DEVE citar o requisito que atende.
- Cada commit DEVE citar a task no formato `T012 (RF-05): descrição`.
- A spec descreve o quê e o porquê, sem detalhe técnico; o plan descreve o como
  (arquitetura, stack, dados, integrações).

**Motivo:** o projeto segue Spec-Driven Development e é avaliado pela cadeia
commit → task → requisito (RNF-05, CONTRIBUTING).

### IV. Testes e cobertura (NÃO NEGOCIÁVEL)

- A cobertura mínima é de 80% em linhas e em branches sobre o núcleo da lógica:
  geradores de Portugol, definição de blocos, serialização de projeto e adapter do
  Core. Componentes de interface e renderização PODEM ficar fora da medição, desde
  que a exclusão esteja declarada na configuração de cobertura.
- Os testes de aceitação DEVEM partir de um projeto em blocos (JSON), gerar o
  Portugol, compilá-lo e executá-lo com o `meupia-core` real na versão fixada e
  comparar a saída com a esperada. Mocks do Core NÃO substituem esses testes.
- O relatório de cobertura DEVE ser versionado no repositório.
- O README DEVE mostrar no topo a linha `N testes · X% de cobertura`, atualizada a
  cada entrega.
- Uma entrega abaixo de 80% ou com teste de aceitação falhando NÃO PODE ser
  integrada à `main`.

**Motivo:** a cobertura e os testes de aceitação são critérios explícitos do trabalho
e a única prova de que o Portugol gerado de fato roda no Core (RNF-04, RNF-07).

### V. pt-BR e foco no iniciante

- Interface, mensagens de erro, documentação e nomes de blocos DEVEM estar em
  português do Brasil.
- Os blocos DEVEM usar as mesmas palavras do Portugol (`leia`, `escreva`, `se`,
  `senao`, `enquanto`, `para`), para que a transição para o código escrito seja
  natural.
- Erros do Core DEVEM ser mostrados em linguagem amigável ao iniciante, sem stack
  trace do Python; o detalhe técnico PODE ficar disponível de forma secundária.

**Motivo:** o público é o iniciante que trava antes do Portugol escrito; o editor é o
degrau anterior, não um idioma paralelo (RNF-03).

### VI. Simplicidade de PoC

- O escopo mínimo vem primeiro: variáveis, leia/escreva, se/senão, enquanto/para,
  operadores, Portugol em tempo real, execução pelo Core e salvar/carregar JSON
  (RF-01 a RF-12).
- Sem backend, sem contas de usuário; o editor roda 100% no navegador (RNF-06).
- Nenhuma dependência PODE ser adicionada sem justificativa registrada no plan.
- Escopo completo (RF-F01, RF-F02) e bônus (RF-B01) só começam depois que o escopo
  mínimo estiver pronto e testado.

**Motivo:** a entrega avaliada é uma PoC pequena, bem especificada e funcionando
(decisão D-04).

## Restrições técnicas e stack

Registro obrigatório de toda escolha de stack. Mudar qualquer item abaixo é uma
emenda a esta constituição.

| Área | Escolha |
| --- | --- |
| Front-end | Estático: HTML + JavaScript (ES Modules), empacotado com Vite. |
| Editor de blocos | Google Blockly, com gerador de código próprio para Portugol. |
| Execução | Pyodide no navegador, instalando `meupia-core==1.4.1` via micropip, no mesmo modelo do meuPiá Lab. |
| Testes do núcleo | Vitest com cobertura v8. |
| Testes de aceitação | Executam o Portugol gerado no `meupia-core` 1.4.1 real (Pyodide ou Python com o pacote do PyPI; a escolha é feita e justificada no plan). |
| Projetos salvos | JSON em formato próprio versionado, com campo de versão do formato (ver Q-06). |
| Licença | GPL-3.0, herdada do repositório oficial. |

## Fluxo de desenvolvimento

- O trabalho parte de um fork de `github.com/meuPia/blocos`.
- Cada feature tem sua branch, criada a partir da `main`.
- Cada pull request descreve o que mudou e qual requisito foi atendido, conforme o
  `CONTRIBUTING.md`.
- O ciclo SpecKit é seguido em ordem: constitution → specify → clarify → plan →
  tasks → analyze → implement.
- Perguntas e decisões do briefing ficam registradas em
  `docs/briefing/02-requisitos-extraidos.md` e DEVEM ser atualizadas quando
  respondidas ou revistas.

## Governança

- Esta constituição prevalece sobre qualquer outra prática, guia ou convenção do
  projeto. Em caso de conflito, vale a constituição.
- Toda emenda DEVE atualizar a versão, a data de última emenda e registrar o motivo
  da mudança na mensagem de commit e no relatório de impacto.
- Versionamento semântico:
  - MAJOR: remoção ou redefinição incompatível de princípio ou regra de governança.
  - MINOR: novo princípio ou seção, ou ampliação material de orientação existente.
  - PATCH: esclarecimentos, redação, correções sem mudança de sentido.
- Todo plan DEVE passar pelo "Constitution Check", verificando os princípios I a VI,
  antes de virar tasks. Violações só são aceitas se justificadas na tabela de
  complexidade do plan.
- Toda revisão de pull request DEVE verificar a conformidade com esta constituição,
  em especial os princípios NÃO NEGOCIÁVEIS (I e IV).

**Versão**: 1.0.0 | **Ratificada**: 2026-11-08 | **Última emenda**: 2026-11-08
