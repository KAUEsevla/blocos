# Modelo de dados (Fase 1): Tela de três painéis

A 001 não cria formato de arquivo novo. O **Projeto** é o formato v1 definido na 008
([data-model da 008](../008-portugol-valido/data-model.md)) e devolvido por
`projetoVazio()` em `src/projeto/formato.js`. Esta spec acrescenta só o estado que a
tela precisa guardar em memória.

## Projeto aberto

O projeto que está no editor. Mesmo formato do arquivo v1:

| Campo | Origem na tela | Observação |
| --- | --- | --- |
| `formato`, `versao` | constantes de `formato.js` | Não entram na assinatura (R-05). |
| `nome` | campo "Nome do programa" (`#nome-programa`), valor bruto | O gerador saneia (`sanearNomePrograma`); o campo mostra o que o estudante digitou. |
| `variaveis` | `[]` nesta spec | Criadas pela spec 002. |
| `blocos` | `serializarBlocos(ws)` | Sem `blocos.variables` (regra da 008). |

**Regras**:
- Projeto novo = `projetoVazio()`: nome `MeuPrograma`, sem variáveis, só o bloco
  `programa` (não apagável).
- O painel Portugol mostra sempre `gerarPortugol(projetoAberto).codigo`; não há outro
  caminho para mudar esse texto (FR-004).

## Referência de "salvo"

`referencia: string`, a assinatura do último estado considerado salvo
([contrato alteracoes.md](contracts/alteracoes.md)).

| Momento | Quem marca | Valor |
| --- | --- | --- |
| Página aberta | 001 (`main.js`) | assinatura do projeto novo **depois** de carregado no workspace |
| Novo confirmado (ou sem alterações) | 001 (`main.js`) | idem |
| Projeto salvo | 011 | assinatura do projeto gravado |
| Projeto carregado | 012 | assinatura do projeto carregado, depois de carregado no workspace |

**Derivado**: `alterado = haAlteracoes(projetoAberto, referencia)`. Não é guardado;
é calculado na hora em que o Novo é clicado.

## Estado da tela

Estado só de interface, sem persistência:

| Elemento | Estados nesta spec | Quem muda depois |
| --- | --- | --- |
| Botão Executar | `disabled` | 009: habilitado; desabilitado durante a execução |
| Botões Salvar e Carregar | `disabled` | 011 e 012: habilitados |
| Botão Novo | habilitado | — |
| Botão "Copiar código" | habilitado | — |
| Mensagem de cópia | vazia → "Código copiado!" ou mensagem de falha → vazia após 3 s | — |
| Painel Saída | orientação inicial | 009 e 010 (contrato [painel-saida.md](contracts/painel-saida.md)) |
| Diálogo de confirmação | fechado → aberto → fechado (`true`/`false`) | 012 pode reaproveitar |

## Transições do Novo

```text
clique em Novo
  ├─ haAlteracoes(projeto, referencia) = false ─────────────────┐
  └─ = true → confirmar(...)                                    │
              ├─ false (Cancelar / Esc) → nada muda             │
              └─ true ──────────────────────────────────────────┤
                                                                ▼
        projeto = projetoVazio(); campo nome = "MeuPrograma";
        recarregarBlocos(ws, projeto.blocos); Portugol regenerado;
        saida.limpar(); saida.mostrarOrientacao();
        referencia = assinaturaProjeto({ ...projeto, blocos: serializarBlocos(ws) })
```

Novo sem alterações também restaura o projeto novo e limpa a Saída (não há o que
perder, então não pergunta).
