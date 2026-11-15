# Quickstart: validar a tela de três painéis

Roteiro para provar que a spec 001 funciona. Os detalhes de ids, rótulos e layout estão
em [contracts/tela.md](contracts/tela.md); a regra de "não salvo", em
[contracts/alteracoes.md](contracts/alteracoes.md).

## Pré-requisitos

- Node.js ≥ 20 e dependências instaladas (`npm ci`), como na 008.
- Navegador atual (Chrome, Firefox ou Edge).

## 1. Testes automáticos

```bash
npm run test:unidade
```

Esperado: todos passam, incluindo `alteracoes.test.js` e `tela-estrutura.test.js`.

```bash
npm run cobertura
```

Esperado: linhas e branches ≥ 80% no núcleo, com `src/projeto/alteracoes.js` na lista
medida; a suíte de aceitação da 008 continua passando; README atualizado.

## 2. Tela no navegador

```bash
npm run dev
```

Abrir `http://localhost:5173` (ou a configuração `meupia-blocos` do `.claude/launch.json`).

| # | Passo | Resultado esperado | Requisito |
| --- | --- | --- | --- |
| 1 | Janela com 1280 × 800 px | Barra no topo; painéis **Blocos**, **Portugol**, **Saída** lado a lado, nessa ordem, com título; a página não tem barra de rolagem | FR-001, SC-001 |
| 2 | Olhar o conteúdo inicial | Blocos: bloco `programa`. Portugol: `algoritmo "MeuPrograma"`, linha vazia, `inicio`, `fim_algoritmo`. Saída: orientação de como executar | História 1, cenário 2 |
| 3 | Olhar a barra | Campo "Nome do programa" com `MeuPrograma`; botões Executar, Salvar, Carregar (desabilitados, dica "Disponível em breve") e Novo | FR-002, História 2, cenário 1 |
| 4 | Trocar o nome para `Soma` | A primeira linha do Portugol vira `algoritmo "Soma"` | FR-002 |
| 5 | Clicar no Portugol e digitar | Nada muda no texto | FR-004, História 3, cenário 1 |
| 6 | Clicar em "Copiar código" e colar num editor de texto | Aparece "Código copiado!"; o texto colado é o Portugol completo | FR-004, História 3, cenário 2 |
| 7 | Redimensionar a janela para 1024 px e depois para 800 px | Em 1024 px ainda três colunas; em 800 px os painéis ficam um abaixo do outro, todos acessíveis rolando a página, e a barra continua visível no topo durante a rolagem; o Blockly se ajusta ao novo tamanho sem área cortada | FR-006, História 2 |
| 8 | No console do navegador, simular uma saída longa (200 linhas no painel Saída) e um Portugol longo (300 linhas no painel Portugol) | Saída e Portugol rolam cada um por dentro, sem empurrar os outros painéis nem criar rolagem na página; o Blocos continua no lugar | FR-005, casos de borda "Saída muito longa" e "Programa grande" |
| 9 | Mover o bloco `programa` e clicar em Novo | Abre o diálogo "Começar um projeto novo?" com "Descartar e começar" e "Cancelar"; o foco está em Cancelar | FR-007 |
| 10 | Clicar em Cancelar (e repetir com Esc) | Nada muda | FR-007 |
| 11 | Clicar em Novo e em "Descartar e começar" | Bloco volta à posição inicial, nome volta a `MeuPrograma`, Saída volta à orientação | FR-007, História 2, cenário 2 |
| 12 | Clicar em Novo de novo, sem mexer em nada | Não pergunta; a tela continua no projeto novo | FR-007 |
| 13 | Clicar com o botão direito no workspace e no bloco `programa` | Menus do Blockly em português | FR-003, SC-003 |
| 14 | Percorrer a tela inteira | Nenhum texto em outro idioma | SC-003 |

Para o passo 8, no console do navegador (o Vite serve o módulo pelo caminho do código):

```js
const { criarPainelSaida } = await import('/src/ui/painel-saida.js');
const s = criarPainelSaida(document.getElementById('saida'));
for (let i = 1; i <= 200; i++) s.escrever(`linha ${i}`);

// Portugol longo: hoje só existe o bloco programa, então o texto é simulado.
document.getElementById('codigo-portugol').textContent = 'linha\n'.repeat(300);
```

Depois do passo 8, recarregar a página para voltar ao estado normal.

## 3. Git

```bash
git status
```

Esperado: `.vite/` não aparece mais como não rastreado.
