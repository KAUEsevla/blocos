# Quickstart: validar a execução pelo meuPiá Core

Como provar que a 009 funciona. As regras estão nos [contratos](contracts/) e no
[data-model](data-model.md); aqui ficam só os passos.

## Pré-requisitos

- Node.js ≥ 20 e `npm install` feito.
- Branch `009-executar-no-core`.
- Internet na primeira execução (o Pyodide baixa o `meupia-core` 1.4.1).
- Chrome, Firefox ou Edge atualizado.

## 1. Testes

```bash
npm run test:unidade
```

Esperado: os testes novos passam, em especial:

| Arquivo | Prova |
| --- | --- |
| `tests/unidade/execucao-linhas.test.js` | Uma linha por `escreva`, linha vazia, `\r\n`, pedaço cortado no meio (P-2) |
| `tests/unidade/execucao-mensagens.test.js` | Aviso de fim de cada status, linha do Portugol no erro de compilação, "Detalhes técnicos" só com `detalhe` |
| `tests/unidade/execucao-controlador.test.js` | **Pendência da 008**: com bloco incompleto, o executor não é chamado, a Saída lista os avisos na ordem e o clique destaca o bloco; estados e ordem da Saída (FR-004, FR-006) |
| `tests/unidade/execucao-executor.test.js` | Worker criado no primeiro uso, Parar encerra e recria, mensagens antigas ignoradas, falha de ambiente descarta o worker |
| `tests/unidade/execucao-servico.test.js` | Lotes de 50 ms com relógio falso, `preparar` idempotente, exceção vira resultado |
| `tests/unidade/executor-core.test.js` | Tradução pt-BR ampliada; "Não é possível dividir por zero." |
| `tests/unidade/tela-estrutura.test.js` | Executar habilitado e Parar desabilitado logo depois dele |

```bash
npm run test:aceitacao
```

Esperado, além dos casos das specs anteriores:

- `tests/aceitacao/executar.test.js` (Core real dentro de `worker_threads`): "Olá, mundo!"
  em fluxo com `ok` em menos de 2 s depois do ambiente pronto (SC-002); `enquanto
  verdadeiro` escrito à mão interrompido por `parar()`, com uma execução normal logo
  depois (História 3); 1.500 linhas inteiras, na ordem e em mais de um lote; divisão
  por zero com as linhas anteriores e o rastro em `detalhe`.
- Todos os casos de `tests/aceitacao/casos/` passam pelo divisor e dão as mesmas linhas
  que `saidaEsperada` (SC-001).

```bash
npm run cobertura
```

Esperado: ≥ 80% em linhas e branches, com `src/execucao/**` medido; README com a linha
`**Testes:** N · **Cobertura:** X%` atualizada; relatório em `cobertura/`.

```bash
npm run build
```

Esperado: o build gera o worker como arquivo separado (`worker-*.js` em `dist/assets/`),
sem erro.

## 2. No navegador (`npm run dev`)

Abrir as ferramentas do desenvolvedor na aba Rede para os passos A e F.

| # | Passo | Esperado | Cobre |
| --- | --- | --- | --- |
| A | Cache limpo. Cronômetro ligado ao abrir a página. Montar `escreva("Olá, mundo!")` e clicar em Executar | A Saída é limpa e mostra a mensagem `preparando` ("Preparando o ambiente do meuPiá. Na primeira vez isso pode levar até 30 segundos."), "Carregando o Python (1 de 2)...", "Instalando o meuPiá Core (2 de 2)...", "Executando...", "Olá, mundo!" e "Fim do programa". Durante a espera, Executar desabilitado e Parar habilitado. Anotar o tempo da preparação (≤ 30 s) e o tempo total (< 2 min) | História 1, cenários 1 a 3; SC-003; **SC-002 da 003** |
| B | Nas DevTools, aba Desempenho, iniciar a gravação; clicar em Executar de novo; parar a gravação quando aparecer "Fim do programa" | Só "Executando...", "Olá, mundo!" e "Fim do programa". Na linha do tempo, do clique até a última linha escrita, no máximo 2 s | SC-002 |
| C | `escreva("a")`, `escreva("")`, `escreva("b")` | Três linhas, a do meio vazia e visível | **FR-003 da 003** |
| D | Remover o valor de um `escreva` e clicar em Executar | Nada roda. A Saída mostra "O programa tem blocos incompletos. Complete-os para executar." e a lista de avisos. Clicar no aviso seleciona o bloco e centraliza a área nele | **Pendência da 008** (RF-08) |
| E | `escreva(1 ÷ 0)` depois de `escreva("antes")` | "antes", "Erro de execução", "Não é possível dividir por zero." e "Detalhes técnicos" fechado. Abrir mostra o `Traceback` | História 2, cenários 2 e 3 |
| F | Na aba Rede, conferir as requisições do passo B | Nenhuma requisição leva o programa. Só os arquivos do Pyodide e do pacote vêm da rede, e no passo B nem eles | FR-008 |
| G | Desligar a rede (aba Rede, "Offline"), recarregar a página e clicar em Executar | "Não foi possível carregar o ambiente do meuPiá. Verifique a conexão e tente de novo." Executar volta a ficar habilitado. Religar a rede e clicar de novo: roda | Caso de borda "sem internet" |
| H | Clicar em Executar e, logo em seguida, mudar um bloco | A Saída mostra o resultado do programa como estava no clique | Caso de borda "alterar durante a execução" |
| I | Programa só com uma variável e nenhum `escreva` | "Executando..." e "Fim do programa" | Caso de borda "sem escreva" |

O Parar com um laço infinito e as mais de 1.000 linhas montadas com blocos dependem do
`enquanto` da 005. Aqui eles são provados na aceitação (passo 1) e voltam ao quickstart
da 005 ([R-14](research.md)).

## 3. Registro

Anotar no PR os tempos medidos nos passos A e B e o navegador usado.
