# Contrato: gerador de Portugol

Módulo `src/portugol/gerador.js`. Núcleo puro: não importa `blockly`, não acessa DOM,
relógio, `Math.random` nem estado global mutável.

## API

```js
gerarPortugol(projeto, registro = registroPadrao) → { codigo: string, avisos: Aviso[] }
sanearNomePrograma(nome: unknown) → string
verificarExecucao({ codigo, avisos }) → { permitida: boolean, motivo: string|null, avisos: Aviso[] }
MARCADOR_AUSENTE === '???'
```

- `projeto` e `Aviso`: ver [data-model.md](../data-model.md).
- `registro` é injetável para os testes usarem blocos falsos; em produção é o registro
  com todos os blocos das specs 002–006.
- Nunca lança exceção para projetos estruturalmente estranhos: tipo de bloco
  desconhecido gera o aviso "Bloco desconhecido: <type>" com `???` no lugar dele, e
  `blocos` ausente equivale a um programa sem comandos.
- Não altera o objeto `projeto` recebido.

## Formato do texto

Gramática do texto emitido (`⏎` = `\n`, `·` = 4 espaços por nível):

```text
algoritmo "<NomeSaneado>"⏎
⏎
[ var⏎
  ·<nome>: <tipo>⏎          (uma linha por variável; ordem: inteiro, real, cadeia, logico; dentro do tipo, ordem de criação)
  ⏎ ]
inicio⏎
  ·<comando>⏎                (comandos da área COMANDOS do bloco programa, nível 1)
  ··<comando aninhado>⏎      (+1 nível a cada se/senao/enquanto/para)
fim_algoritmo⏎
```

Regras:

1. Só LF; nunca `\r` nem tabulação; nenhuma linha termina com espaço.
2. Indentação = `"    ".repeat(nivel)`. O nível do corpo do `inicio` e das
   declarações do `var` é 1.
3. Sem variáveis, não há a linha `var` nem a linha em branco que a segue.
4. Palavras reservadas sempre em minúsculas e sem acento (`entao`, `senao`, `faca`,
   `ate`, `nao`).
5. O texto termina com `fim_algoritmo\n`.

### Exemplos normativos

Projeto novo (`nome: "MeuPrograma"`, sem variáveis e sem blocos):

```text
algoritmo "MeuPrograma"

inicio
fim_algoritmo
```

Com variáveis e aninhamento (os blocos de comando são das specs 002–005):

```text
algoritmo "Contagem"

var
    i: inteiro
    media: real
    nome: cadeia
    ok: logico

inicio
    leia(nome)
    para i de 1 ate 3 faca
        se i % 2 = 0 entao
            escreva(nome, " par ", i)
        senao
            escreva(i)
        fim_se
    fim_para
fim_algoritmo
```

Com bloco incompleto (condição do `se` vazia):

```text
inicio
    se ??? entao
        escreva("oi")
    fim_se
fim_algoritmo
```

com `avisos = [{ blocoId: "<id do se>", tipoBloco: "se", encaixe: "CONDICAO", mensagem: "Falta a condição do bloco se" }]`.

## Avisos

- Texto: `Falta ${parte} do bloco ${rotulo}`, em que `parte` (com artigo) e `rotulo`
  são declarados pelo bloco no registro.
- Ordem: a de emissão no texto (pré-ordem; dentro de um bloco, na ordem dos
  encaixes declarada pelo gerador do bloco).
- Blocos soltos não são visitados e não geram avisos.

## Bloqueio de execução (FR-006)

`verificarExecucao` devolve `permitida: false` sempre que `avisos.length > 0`. A spec
009 só chama o adapter do Core quando `permitida` é `true`. Assim, nenhum texto com
`???` chega ao Core (SC-003).

## Garantias testadas

| Garantia | Teste |
| --- | --- |
| Cenário 1 (projeto novo) | unidade: texto exato; aceitação: o Core aceita. |
| Ordem da estrutura e seção `var` | unidade com as quatro tipos e com `variaveis: []`. |
| 4 espaços por nível, sem tab | unidade com blocos falsos aninhados em 6 níveis; regex `/\t/` e `/ +$/m` não casam. |
| Determinismo (FR-004) | gerar duas vezes; gerar depois de `JSON.parse(JSON.stringify(projeto))`; os resultados são iguais. |
| Nome (FR-007) | vazio, só espaços, `"`, `\`, quebra de linha, 41+ caracteres, acentos no limite de 40. |
| Avisos | encaixe vazio gera aviso + `???`; vários avisos saem na ordem do texto; bloco solto incompleto não gera aviso. |
| Bloqueio | `verificarExecucao` com e sem avisos. |
