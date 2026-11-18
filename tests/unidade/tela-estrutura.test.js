import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TEXTOS } from '../../src/ui/textos.js';
import { TIPOS_VARIAVEL } from '../../src/projeto/formato.js';

// Estrutura estática da tela (spec 001, contracts/tela.md; research R-08). Sem jsdom:
// o HTML é lido como texto e conferido por expressões regulares.
const RAIZ = join(import.meta.dirname, '..', '..');
const html = readFileSync(join(RAIZ, 'index.html'), 'utf8');

const PALAVRAS_INGLES = ['Run', 'Save', 'Load', 'New', 'Copy', 'Cancel', 'OK', 'Undo', 'Redo'];
const CHAVES_TEXTOS = [
  'orientacaoSaida',
  'copiaOk',
  'copiaFalhou',
  'novoTitulo',
  'novoMensagem',
  'novoConfirmar',
  'cancelar',
  'emBreve',
  'salvarDica',
  'alteracoesNaoSalvas',
  'carregarDica',
  'carregarTitulo',
  'carregarMensagem',
  'carregarConfirmar',
  'carregarFalhouTitulo',
  'entendi',
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

  it('barra com o nome do programa e as cinco ações (com Parar, spec 009), nessa ordem', () => {
    const barra = trecho('header', 'barra');
    expect(barra).not.toBeNull();
    expect(barra).toMatch(/<label for="nome-programa">Nome do programa<\/label>/);

    const campo = tagComId('nome-programa');
    expect(campo).toMatch(/type="text"/);
    expect(campo).toMatch(/value="MeuPrograma"/);
    expect(campo).toMatch(/maxlength="40"/);

    const botoes = [
      ['botao-executar', 'Executar'],
      ['botao-parar', 'Parar'],
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
    // Spec 009 (contracts/tela-execucao.md): Executar habilitado; Parar logo depois, desabilitado no ocioso.
    expect(tagComId('botao-executar')).not.toMatch(/\bdisabled\b/);
    expect(tagComId('botao-executar')).not.toMatch(/title=/);
    expect(tagComId('botao-parar')).toMatch(/type="button"/);
    expect(tagComId('botao-parar')).toMatch(/\bdisabled\b/);
    // Spec 011 (contracts/tela-salvar.md): Salvar habilitado.
    expect(tagComId('botao-salvar')).not.toMatch(/\bdisabled\b/);
    expect(tagComId('botao-salvar')).not.toMatch(/Disponível em breve/);
    expect(tagComId('botao-salvar')).toMatch(/title="Salvar o projeto num arquivo \.json"/);
    // Spec 012 (contracts/tela-carregar.md): Carregar habilitado.
    expect(tagComId('botao-carregar')).not.toMatch(/\bdisabled\b/);
    expect(tagComId('botao-carregar')).not.toMatch(/Disponível em breve/);
    expect(tagComId('botao-carregar')).toMatch(/title="Carregar um projeto salvo \(\.json\)"/);
    expect(tagComId('botao-novo')).not.toMatch(/\bdisabled\b/);
  });

  it('campo de arquivo oculto logo depois do botão Carregar (spec 012, FR-001)', () => {
    const acoes = html.slice(html.indexOf('class="barra-acoes"'));
    const tag = tagComId('arquivo-carregar');
    expect(tag).toMatch(/^<input\b/);
    expect(tag).toMatch(/type="file"/);
    expect(tag).toMatch(/accept="[^"]*\.json[^"]*"/);
    expect(tag).toMatch(/\bhidden\b/);
    const pos = posicao(acoes, 'id="arquivo-carregar"');
    expect(pos).toBeGreaterThan(posicao(acoes, 'id="botao-carregar"'));
    expect(pos).toBeLessThan(posicao(acoes, 'id="botao-novo"'));
    expect(TEXTOS.carregarDica).toBe('Carregar um projeto salvo (.json)');
    expect(TEXTOS.carregarTitulo).toBe('Carregar outro projeto?');
    expect(TEXTOS.carregarMensagem).toBe('As alterações que não foram salvas serão perdidas.');
    expect(TEXTOS.carregarConfirmar).toBe('Descartar e carregar');
  });

  it('indicação de alterações não salvas logo depois do nome (spec 011, FR-006)', () => {
    const barra = trecho('header', 'barra');
    const tag = tagComId('indicador-alteracoes');
    expect(tag).toMatch(/^<span\b/);
    expect(tag).toMatch(/class="indicador-alteracoes"/);
    expect(tag).toMatch(/aria-live="polite"/);
    expect(tag).toMatch(/\bhidden\b/);
    const pos = posicao(barra, 'id="indicador-alteracoes"');
    expect(pos).toBeGreaterThan(posicao(barra, 'id="nome-programa"'));
    expect(pos).toBeLessThan(posicao(barra, 'class="barra-acoes"'));
    expect(TEXTOS.alteracoesNaoSalvas).toBe('alterações não salvas');
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

  it('painel Blocos com Desfazer e Refazer no cabeçalho (spec 007, FR-006)', () => {
    const blocos = trecho('section', 'painel-blocos');
    const inicioCabecalho = blocos.search(/<div class="painel-cabecalho">/);
    const fimCabecalho = blocos.indexOf('</div>', inicioCabecalho);
    expect(inicioCabecalho, 'cabeçalho do painel Blocos').toBeGreaterThanOrEqual(0);
    const cabecalho = blocos.slice(inicioCabecalho, fimCabecalho);

    const botoes = [
      ['titulo-blocos', null, null],
      ['botao-desfazer', 'Desfazer', 'Desfazer (Ctrl+Z)'],
      ['botao-refazer', 'Refazer', 'Refazer (Ctrl+Y)'],
    ];
    let anterior = -1;
    for (const [id, texto, dica] of botoes) {
      const pos = posicao(cabecalho, `id="${id}"`);
      expect(pos, `${id} no cabeçalho, nessa ordem`).toBeGreaterThan(anterior);
      anterior = pos;
      if (!texto) continue;
      const tag = tagComId(id);
      expect(tag).toMatch(/^<button\b/);
      expect(tag).toMatch(/type="button"/);
      expect(tag).toMatch(/\bdisabled\b/);
      expect(tag).toMatch(new RegExp(`title="${dica.replace(/[()+]/g, '\\$&')}"`));
      expect(trecho('button', id)).toMatch(new RegExp(`>${texto}</button>$`));
    }
    expect(cabecalho).toMatch(/<h2 id="titulo-blocos">Blocos<\/h2>/);
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

describe('diálogo de variável (spec 002, RF-02; contracts/editor-variaveis.md)', () => {
  const dialogo = trecho('dialog', 'dialogo-variavel');

  it('existe, com título, nome de até 30 caracteres, tipo, erro e os dois botões', () => {
    expect(dialogo).not.toBeNull();
    expect(dialogo).toMatch(/aria-labelledby="variavel-titulo"/);
    expect(dialogo).toMatch(/<h2 id="variavel-titulo">/);
    expect(tagComId('variavel-nome')).toMatch(/maxlength="30"/);
    expect(dialogo).toMatch(/<select id="variavel-tipo">/);
    expect(tagComId('variavel-erro')).toMatch(/role="alert"/);
    expect(dialogo).toMatch(/<button type="button" id="variavel-cancelar">Cancelar<\/button>/);
    expect(dialogo).toMatch(/id="variavel-confirmar"/);
  });

  it('os tipos são exatamente TIPOS_VARIAVEL, nessa ordem', () => {
    const valores = [...dialogo.matchAll(/<option value="([^"]+)"/g)].map((m) => m[1]);
    expect(valores).toEqual([...TIPOS_VARIAVEL]);
  });

  it('nenhum texto em inglês', () => {
    expect(temPalavraEmIngles(dialogo)).toBeUndefined();
  });
});
