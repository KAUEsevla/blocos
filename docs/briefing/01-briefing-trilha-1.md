# Briefing original — Trilha 1: meuPiá Blocos

> Texto do enunciado do Trabalho Final (Trilhas de SDD), mantido sem edição para
> rastreabilidade. Os requisitos extraídos estão em
> [02-requisitos-extraidos.md](02-requisitos-extraidos.md).

Editor no-code estilo Scratch para o ecossistema meuPiá. Complexidade: média a alta.

**O desafio.** O meuPiá começa no Portugol escrito, mas muitos iniciantes travam
antes disso. Falta o degrau anterior: montar o programa com blocos e ver o
Portugol nascer ao lado.

**O projeto.** Construir do zero um editor de blocos que gera Portugol válido e o
executa pelo Core do meuPiá. A tela tem três painéis: blocos, Portugol gerado e
saída da execução. A dupla parte de um fork do repositório oficial do editor,
github.com/meuPia/blocos, que vem vazio (apenas README, CONTRIBUTING e licença),
para manter o padrão do ecossistema meuPiá. O CONTRIBUTING do repositório traz as
regras de contribuição que a dupla deve seguir.

**Referências.** Scratch, Snap!, Pencil Code, Blockly e Microsoft MakeCode.

**Restrições.**
- O editor consome o Core e os módulos do meuPiá apenas pelas interfaces públicas
  (parser, API de execução, pacotes mpgp). Nenhum arquivo do meuPiá pode ser
  modificado. Se faltar algo, o grupo abre uma issue e resolve com um adapter do
  lado do editor.
- A versão do meuPiá usada é a tag congelada para a turma.
- Interface toda em pt-BR. Stack sugerida: Blockly.

**Escopo mínimo.**
- Blocos de variáveis, leia/escreva, se/senão, enquanto/para e operadores.
- Portugol gerado em tempo real, executado pelo Core.
- Salvar e carregar projetos em JSON.

**Escopo completo.**
- Toolbox por missão: uma missão do Desafios define quais blocos ficam disponíveis.
- Blocos de pelo menos um módulo do meuPiá (Grid, Maker ou IA).

**Bônus.** Caminho de volta: converter Portugol existente em blocos.

**O que os testes de aceitação verificam.** Dado um programa em blocos (JSON), o
Portugol gerado precisa ser aceito pelo parser do Core e produzir a saída esperada
na execução.

## Regras gerais do trabalho (resumo)
- SDD com GitHub SpecKit (escolha da dupla); assistente de IA: Claude Code.
- Cobertura mínima de 80%, com relatório no repositório; README mostra no topo
  "N testes · X% de cobertura", atualizado a cada entrega.
- Cada commit aponta para a task; cada task aponta para o requisito.
- Toda escolha de stack fica registrada na constitution.
- Avaliados: constitution, specs, plans, tasks e pitch. PoC pequena e funcionando.
