# Como contribuir com o meuPiá Blocos

Obrigado pelo interesse! O meuPiá Blocos é desenvolvido com
**Spec-Driven Development (SDD)**: a especificação é o artefato principal e o
código serve a ela.

## Fluxo
1. Faça um **fork** deste repositório.
2. Crie uma branch a partir da `main`.
3. Escreva ou atualize os artefatos de especificação **antes** do código.
4. Implemente, teste e abra um **pull request** descrevendo o que mudou e qual
   requisito foi atendido.

## Artefatos de especificação
Use GitHub SpecKit ou OpenSpec. Os artefatos ficam versionados no repositório:
- **Constitution:** princípios do projeto (padrões, restrições, qualidade).
- **Spec:** o quê e o porquê, em user stories com critérios de aceite
  verificáveis, **sem detalhes técnicos**.
- **Plan:** o como: arquitetura, stack, dados e integrações.
- **Tasks:** fatias verticais pequenas, cada uma rastreável até a spec.

## Regras
- **Rastreabilidade:** cada commit referencia a task que implementa, e cada
  task referencia o requisito que atende.
- **Testes:** cobertura mínima de **80%** sobre o núcleo da lógica (componentes
  de interface e renderização podem ficar de fora da medição).
- **README atualizado:** a quantidade de testes e o percentual de cobertura no
  topo do README são atualizados a cada entrega.
- **Ecossistema intocado:** o Core e os módulos do meuPiá são usados apenas pelas
  interfaces públicas. Se faltar algo, abra uma issue no repositório do módulo e
  resolva com um adapter deste lado.
- **Idioma:** interface, documentação e mensagens para o usuário em português
  do Brasil.

## Reportando problemas
Abra uma issue descrevendo o comportamento esperado, o observado e os passos
para reproduzir.
