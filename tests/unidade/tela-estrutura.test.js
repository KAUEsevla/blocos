import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TEXTOS } from '../../src/ui/textos.js';

// Estrutura estática da tela (spec 001, contracts/tela.md; research R-08). Sem jsdom:
// o HTML é lido como texto e conferido por expressões regulares.
const RAIZ = join(import.meta.dirname, '..', '..');
const html = readFileSync(join(RAIZ, 'index.html'), 'utf8');

const PALAVRAS_INGLES = ['Run', 'Save', 'Load', 'New', 'Copy', 'Cancel', 'OK'];
const CHAVES_TEXTOS = [
  'orientacaoSaida',
  'copiaOk',
  'copiaFalhou',
  'novoTitulo',
  'novoMensagem',
  'novoConfirmar',
  'cancelar',
  'emBreve',
];

// Trecho do elemento com o id dado, da abertura da tag até o fechamento correspondente
// (o primeiro </tag> depois dela; as tags conferidas aqui não se aninham com a mesma tag).
function trecho(tag, id) {
  const inicio = html.search(new RegExp(`<${tag}\\b[^>]*\\bid="${id}"`));
  if (inicio < 0) return null;
  const fim = html.indexOf(`</${tag}>`, inicio);
  return fim < 0 ? null : html.slice(inicio, fim + tag.length + 3);
}

function tagComId(id) {
  const m = html.match(new RegExp(`<[a-z0-9]+\\b[^>]*\\bid="${id}"[^>]*>`));
  return m ? m[0] : null;
}

function posicao(texto, trechoProcurado) {
  return texto.indexOf(trechoProcurado);
}

function temPalavraEmIngles(texto) {
  return PALAVRAS_INGLES.find((p) => new RegExp(`\\b${p}\\b`).test(texto));
}

describe('estrutura da tela (RF-01, RNF-03)', () => {
  it('documento em pt-BR, com título e sem <style> inline', () => {
    expect(html).toMatch(/<html lang="pt-BR">/);
    expect(html).toMatch(/<title>meuPiá Blocos<\/title>/);
    expect(html).not.toMatch(/<style\b/);
  });

  it('barra com o nome do programa e as quatro ações, nessa ordem', () => {
    const barra = trecho('header', 'barra');
    expect(barra).not.toBeNull();
    expect(barra).toMatch(/<label for="nome-programa">Nome do programa<\/label>/);

    const campo = tagComId('nome-programa');
    expect(campo).toMatch(/type="text"/);
    expect(campo).toMatch(/value="MeuPrograma"/);
    expect(campo).toMatch(/maxlength="40"/);

    const botoes = [
      ['botao-executar', 'Executar'],
      ['botao-salvar', 'Salvar'],
      ['botao-carregar', 'Carregar'],
      ['botao-novo', 'Novo'],
    ];
    let anterior = -1;
    for (const [id, rotulo] of botoes) {
      const botao = trecho('button', id);
      expect(botao, id).not.toBeNull();
      expect(botao).toMatch(new RegExp(`>${rotulo}</button>$`));
      const pos = posicao(barra, `id="${id}"`);
      expect(pos, `${id} dentro da barra`).toBeGreaterThan(anterior);
      anterior = pos;
    }
    for (const id of ['botao-executar', 'botao-salvar', 'botao-carregar']) {
      expect(tagComId(id)).toMatch(/\bdisabled\b/);
      expect(tagComId(id)).toMatch(/title="Disponível em breve"/);
    }
    expect(tagComId('botao-novo')).not.toMatch(/\bdisabled\b/);
  });

  it('três painéis na ordem Blocos → Portugol → Saída, cada um com o seu título', () => {
    const paineis = trecho('main', 'paineis');
    expect(paineis).not.toBeNull();
    const ordem = [
      ['painel-blocos', 'titulo-blocos', 'Blocos'],
      ['painel-portugol', 'titulo-portugol', 'Portugol'],
      ['painel-saida', 'titulo-saida', 'Saída'],
    ];
    let anterior = -1;
    for (const [secao, titulo, texto] of ordem) {
      const pos = posicao(paineis, `id="${secao}"`);
      expect(pos, secao).toBeGreaterThan(anterior);
      anterior = pos;
      const s = trecho('section', secao);
      expect(tagComId(secao)).toMatch(new RegExp(`aria-labelledby="${titulo}"`));
      expect(s).toMatch(new RegExp(`<h2 id="${titulo}">${texto}</h2>`));
    }
  });

  it('conteúdo de cada painel', () => {
    expect(trecho('section', 'painel-blocos')).toMatch(/<div id="area-blocos"/);

    const portugol = trecho('section', 'painel-portugol');
    expect(portugol).toMatch(/<button[^>]*id="botao-copiar"[^>]*>Copiar código<\/button>/);
    expect(portugol).toMatch(/<span[^>]*id="mensagem-copia"[^>]*aria-live="polite"/);
    const pre = tagComId('codigo-portugol');
    expect(pre).toMatch(/^<pre\b/);
    expect(pre).toMatch(/tabindex="0"/);
    expect(pre).not.toMatch(/contenteditable/);
    expect(portugol).toContain('id="codigo-portugol"');

    expect(trecho('section', 'painel-saida')).toMatch(/<div id="saida"/);
  });

  it('diálogo de confirmação com botões em pt-BR', () => {
    const dialogo = trecho('dialog', 'dialogo-confirmacao');
    expect(dialogo).not.toBeNull();
    expect(dialogo).toMatch(/id="dialogo-titulo"/);
    expect(dialogo).toMatch(/id="dialogo-mensagem"/);
    expect(dialogo).toMatch(/id="dialogo-cancelar"[^>]*>Cancelar</);
    expect(dialogo).toMatch(/id="dialogo-confirmar"[^>]*>Confirmar</);
  });

  it('nenhum rótulo, título ou dica do HTML em inglês (SC-003)', () => {
    const textos = [
      ...[...html.matchAll(/<(button|label|h2)\b[^>]*>([^<]*)</g)].map((m) => m[2]),
      ...[...html.matchAll(/\b(?:title|aria-label)="([^"]*)"/g)].map((m) => m[1]),
    ];
    for (const texto of textos) expect(temPalavraEmIngles(texto), texto).toBeUndefined();
  });

  it('textos da interface em src/ui/textos.js existem e estão em pt-BR', () => {
    expect(Object.isFrozen(TEXTOS)).toBe(true);
    for (const chave of CHAVES_TEXTOS) {
      expect(typeof TEXTOS[chave], chave).toBe('string');
      expect(TEXTOS[chave].trim(), chave).not.toBe('');
      expect(temPalavraEmIngles(TEXTOS[chave]), chave).toBeUndefined();
    }
  });
});
