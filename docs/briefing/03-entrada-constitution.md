# Entrada para `/speckit-constitution`

Cole o bloco abaixo depois do comando `/speckit-constitution` no Claude Code
(aberto na pasta do repositório). Ajustem o que quiserem antes de rodar.

```text
Projeto: meuPiá Blocos — editor de programação por blocos do ecossistema meuPiá, que gera Portugol em tempo real e o executa pelo meuPiá Core, 100% no navegador. Escreva a constitution inteira em português do Brasil. Fontes: docs/briefing/01-briefing-trilha-1.md, docs/briefing/02-requisitos-extraidos.md, CONTRIBUTING.md.

Princípios:
I. Ecossistema intocado (NÃO NEGOCIÁVEL): o Core e os módulos do meuPiá são consumidos apenas pelas interfaces públicas (pacote meupia-core no PyPI, função meuPia.compiler.main, pacotes mpgp). Nenhum arquivo do meuPiá é copiado ou modificado. Toda lacuna vira uma issue no repositório do módulo e é resolvida com um adapter do lado do editor. A versão do Core é fixada (hoje meupia-core 1.4.1, a tag congelada da turma) num único ponto de configuração.
II. Portugol válido por construção: todo programa montado com blocos gera Portugol aceito pelo parser do Core. O gerador é uma função pura (workspace serializado → texto), determinística, com indentação de 4 espaços e a estrutura algoritmo/var/inicio/fim_algoritmo. Blocos incompletos não quebram a geração: viram código seguro ou um aviso visível.
III. Spec primeiro e rastreabilidade: nada é implementado sem spec, plan e task. Requisitos têm IDs (RF-xx, RNF-xx); cada task cita o requisito que atende; cada commit cita a task no formato "T012 (RF-05): descrição". A spec descreve o quê e o porquê, sem detalhe técnico; o plan descreve o como.
IV. Testes e cobertura (NÃO NEGOCIÁVEL): cobertura mínima de 80% (linhas e branches) sobre o núcleo da lógica (geradores, definição de blocos, serialização de projeto, adapter do Core); componentes de interface e renderização podem ficar fora da medição. Os testes de aceitação partem de um projeto em blocos (JSON), geram o Portugol, compilam e executam com o meupia-core real na versão fixada e comparam a saída esperada. Relatório de cobertura versionado no repositório; o README mostra no topo "N testes · X% de cobertura", atualizado a cada entrega.
V. pt-BR e foco no iniciante: interface, mensagens de erro, documentação e nomes de blocos em português do Brasil. Os blocos usam as mesmas palavras do Portugol (leia, escreva, se, senao, enquanto, para), para que a transição para o código escrito seja natural. Erros do Core são mostrados em linguagem amigável.
VI. Simplicidade de PoC: escopo mínimo primeiro (variáveis, leia/escreva, se/senão, enquanto/para, operadores, Portugol em tempo real, execução pelo Core, salvar/carregar JSON). Sem backend, sem contas, sem dependências além das justificadas no plan. Escopo completo e bônus só depois do mínimo pronto e testado.

Restrições técnicas e stack (registro obrigatório):
- Front-end estático: HTML + JavaScript (ES Modules), empacotado com Vite.
- Editor de blocos: Google Blockly, com gerador de código próprio para Portugol.
- Execução: Pyodide no navegador, instalando meupia-core==1.4.1 via micropip, no mesmo modelo do meuPiá Lab.
- Testes: Vitest com cobertura v8 para o núcleo JS; testes de aceitação que executam o Portugol gerado no meupia-core 1.4.1 real (Pyodide ou Python com o pacote do PyPI, a definir no plan).
- Projetos salvos em JSON com formato próprio versionado (campo de versão do formato).
- Licença GPL-3.0, herdada do repositório oficial.

Fluxo de desenvolvimento:
- Fork de github.com/meuPia/blocos; uma branch por feature, criada a partir da main; pull request descrevendo o requisito atendido, conforme o CONTRIBUTING.
- Ciclo SpecKit: constitution → specify → clarify → plan → tasks → analyze → implement.
- Perguntas e decisões do briefing ficam registradas em docs/briefing/02-requisitos-extraidos.md e são atualizadas quando respondidas.

Governança: a constitution prevalece sobre outras práticas; mudanças exigem atualização da versão (semver), data e registro do motivo; todo plan passa pelo "Constitution Check" antes de virar tasks.
```
