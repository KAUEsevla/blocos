# Requisitos extraídos do briefing — Trilha 1 (Ciclo 1: Greenfield)

Este documento é a etapa exigida **antes da spec**: transforma o briefing
(propositalmente incompleto) em requisitos numerados, registra as perguntas em
aberto e as decisões tomadas pela dupla. Os IDs abaixo são os que as specs e as
tasks devem referenciar.

**Recorte desta entrega:** apenas o **escopo mínimo**. Escopo completo e bônus
ficam registrados para ciclos futuros.

## 1. Requisitos funcionais (escopo mínimo)

| ID | Requisito | Origem no briefing |
| --- | --- | --- |
| RF-01 | A tela tem três painéis visíveis ao mesmo tempo: **Blocos**, **Portugol** e **Saída**. | "A tela tem três painéis" |
| RF-02 | Blocos de **variáveis**: declarar variável com tipo (`inteiro`, `real`, `cadeia`, `logico`), atribuir valor e usar o valor numa expressão. | Escopo mínimo |
| RF-03 | Blocos de **entrada e saída**: `leia(variavel)` e `escreva(valor, ...)`. | Escopo mínimo |
| RF-04 | Blocos de **decisão**: `se ... entao ... fim_se` e `se ... entao ... senao ... fim_se`, aninháveis. | Escopo mínimo |
| RF-05 | Blocos de **repetição**: `enquanto ... faca ... fim_enquanto` e `para v de a ate b [passo p] faca ... fim_para`. | Escopo mínimo |
| RF-06 | Blocos de **operadores**: aritméticos (`+ - * / %`), relacionais (`= <> < > <= >=`), lógicos (`e ou nao`), literais de número, texto e lógico. | Escopo mínimo |
| RF-07 | O Portugol é **gerado em tempo real**: toda alteração nos blocos atualiza o painel Portugol sem ação do usuário. | "Portugol gerado em tempo real" |
| RF-08 | O Portugol gerado é **válido** para o Core: estrutura `algoritmo "Nome" / var / inicio / fim_algoritmo`, indentação legível. | "gera Portugol válido" |
| RF-09 | Botão **Executar** roda o Portugol pelo **meuPiá Core** e mostra no painel Saída a saída do programa, ou o erro de compilação/execução em pt-BR. | "executa pelo Core" |
| RF-10 | Quando o programa usa `leia`, o usuário consegue informar a entrada durante a execução. | Implícito em leia/escreva |
| RF-11 | **Salvar** o projeto (blocos) num arquivo `.json` no computador do usuário. | "Salvar e carregar projetos em JSON" |
| RF-12 | **Carregar** um projeto `.json` salvo, restaurando os blocos e o Portugol correspondente. Arquivo inválido gera mensagem clara, sem perder o projeto aberto. | idem |

## 2. Requisitos não funcionais

| ID | Requisito | Origem |
| --- | --- | --- |
| RNF-01 | O Core e os módulos do meuPiá são consumidos **só pelas interfaces públicas**; nenhum arquivo do meuPiá é alterado. Lacunas viram issue no repositório do módulo + adapter do lado do editor. | Restrição |
| RNF-02 | Versão do Core **fixada** na tag congelada da turma. | Restrição |
| RNF-03 | Toda a interface, documentação e mensagens em **pt-BR**. | Restrição + CONTRIBUTING |
| RNF-04 | Cobertura de testes **≥ 80%** sobre o núcleo da lógica, com relatório versionado; README mostra "N testes · X% de cobertura". | Regras do trabalho + CONTRIBUTING |
| RNF-05 | **Rastreabilidade**: commit → task → requisito (RF/RNF). | Regras do trabalho |
| RNF-06 | Roda **100% no navegador**, sem backend, como o meuPiá Lab. | Decisão D-03 |
| RNF-07 | Teste de aceitação: dado um programa em blocos (JSON), o Portugol gerado é aceito pelo parser do Core e produz a saída esperada. | "O que os testes de aceitação verificam" |

## 3. Fora do escopo desta entrega (registrado para depois)

| ID | Item | Classe |
| --- | --- | --- |
| RF-F01 | Toolbox por missão: uma missão do meuPiá Desafios define os blocos disponíveis. | Escopo completo |
| RF-F02 | Blocos de um módulo do meuPiá (Grid, Maker ou IA). | Escopo completo |
| RF-B01 | Caminho de volta: Portugol existente → blocos. | Bônus |
| — | Funções, vetores, listas, dicionários, classes, `continue`/`interrompa`. | Não pedido |
| — | Contas de usuário, salvar na nuvem, colaboração. | Não pedido |

## 4. Perguntas em aberto (para o professor / para decidir)

| ID | Pergunta | Hipótese de trabalho até a resposta |
| --- | --- | --- |
| Q-01 | Qual é a **tag congelada** do meuPiá para a turma? | `meupia-core` **v1.4.1**, a mais recente e a mesma usada pelo meuPiá Lab (`src/engine/wasm.js`). |
| Q-02 | "Integrar na IDE meuPiá" significa embutir no Lab ou ser um app separado no mesmo padrão? | App separado (repositório `blocos`), mesma arquitetura do Lab, com link para abrir o Portugol no Lab futuramente. |
| Q-03 | Quais tipos de variável entram no mínimo? | `inteiro`, `real`, `cadeia`, `logico`. |
| Q-04 | O nome do algoritmo (`algoritmo "..."`) é editável? | Sim, um campo "Nome do programa"; padrão `"MeuPrograma"`. |
| Q-05 | Como o `leia` recebe a entrada no navegador? | Caixa de entrada no painel Saída (o Lab usa `window.prompt`; podemos começar igual). |
| Q-06 | O JSON salvo segue algum formato do ecossistema? | Formato próprio versionado: `{ "formato": "meupia-blocos", "versao": 1, "nome", "blocos": <serialização Blockly> }`. |
| Q-07 | A cobertura de 80% pode excluir componentes de interface? | Sim, o CONTRIBUTING permite: mede-se o núcleo (geradores, serialização, adapter do Core). |

## 5. Decisões tomadas

| ID | Decisão | Motivo |
| --- | --- | --- |
| D-01 | Framework de SDD: **GitHub SpecKit**; assistente: **Claude Code**. | Escolha da dupla. |
| D-02 | Editor de blocos com **Google Blockly**. | Stack sugerida pelo briefing; gerador de código e serialização JSON prontos. |
| D-03 | Execução no navegador com **Pyodide + `meupia-core` via micropip**, como o Lab. | Reaproveita a interface pública já usada no ecossistema (`meuPia.compiler.main`), sem backend. |
| D-04 | Escopo desta entrega = escopo mínimo (RF-01 a RF-12). | Orientação do professor: PoC pequena, bem especificada e funcionando. |
