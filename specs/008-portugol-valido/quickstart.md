# Quickstart: validar "Portugol válido para o Core"

Guia para provar, de ponta a ponta, que a feature 008 funciona. Os detalhes de API
estão nos [contratos](contracts/) e as entidades no [data-model](data-model.md).

## Pré-requisitos

- Node.js 20 ou mais novo (validado no 24) e npm.
- Internet na primeira execução da suíte de aceitação (CDN do Pyodide e PyPI para o
  `meupia-core`).
- Não é preciso ter Python instalado: o Core roda dentro do Pyodide.

## Preparação

```bash
npm install
```

## 1. Testes de unidade (rápidos, sem rede)

```bash
npm run test:unidade
```

Esperado: todos verdes, cobrindo estrutura, seção `var`, indentação, determinismo,
nome do programa, avisos, bloqueio de execução e "versão do Core num ponto só".

## 2. Testes de aceitação (Core real)

```bash
npm run test:aceitacao
```

Esperado:
- O log mostra uma carga do Pyodide + `meupia-core` (~5 s) e depois um teste por
  arquivo em `tests/aceitacao/casos/`.
- `programa-vazio.json`: o Portugol é idêntico ao do cenário 1, o Core aceita e a
  saída é vazia.
- `nome-saneado.json`: nome com aspas e barra invertida; os caracteres saem do
  `algoritmo "…"` e o Core aceita.
- `variaveis-quatro-tipos.json`: seção `var` na ordem inteiro, real, cadeia, logico;
  o Core aceita.
- A meta-verificação de SC-002 passa, porque todo par (tipo, variante) registrado
  aparece em algum caso. A regra de `portugolEsperado` para blocos com área de comandos
  também passa.
- No GitHub, o workflow "Testes" (`.github/workflows/testes.yml`) roda a mesma suíte
  com cobertura em todo push e PR para a `main`.
- Sem rede: a suíte falha no `beforeAll` com "Não foi possível carregar o ambiente
  do meuPiá…", e nenhum caso passa como falso verde.

## 3. Cobertura e README

```bash
npm run cobertura
```

Esperado: `cobertura/coverage-summary.json` e `cobertura/index.html` atualizados,
linhas e branches ≥ 80% no núcleo (abaixo disso o comando falha) e a linha
`**Testes:** N · **Cobertura:** X%` do README reescrita. Os dois arquivos entram no
commit.

## 4. Verificação manual na página

```bash
npm run dev
```

Abrir o endereço que o Vite mostrar (normalmente `http://localhost:5173`).

- O workspace mostra o bloco **programa**, e o Portugol exibido é o do cenário 1.
- Depois da spec 004 (bloco se): encaixar um `se` sem condição. O bloco fica marcado,
  aparece "Falta a condição do bloco se" e o Portugol mostra `se ??? entao`.
- Depois das specs 001/009: clicar em Executar com o aviso presente. Nada é executado
  e a Saída lista o aviso; clicar no aviso destaca o bloco.

## 5. Conferência no meuPiá Lab (premissa da spec)

Copiar o Portugol de qualquer caso de aceitação, colar no meuPiá Lab e clicar em
Rodar. A saída deve ser igual a `saidaEsperada` do caso.

## Adicionando um caso de aceitação (specs 002–006)

1. Montar o programa na página e salvar o `.json` (depois da 011), ou escrever o
   projeto à mão seguindo [contracts/caso-aceitacao.schema.json](contracts/caso-aceitacao.schema.json).
2. Criar `tests/aceitacao/casos/<nome>.json` com `descricao`, `requisitos`,
   `projeto`, `entrada` e `saidaEsperada` (e `portugolEsperado` quando a forma do
   texto importa).
3. `npm run test:aceitacao`.
