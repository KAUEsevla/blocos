import { describe, it, expect } from 'vitest';
import { blocosForaDoPrograma, MENSAGEM_FORA_DO_PROGRAMA } from '../../src/portugol/fora-do-programa.js';
import { projetoVazio } from '../../src/projeto/formato.js';
import { bloco, encadear, projetoDeTeste } from '../auxiliares/blocos-teste.js';

// Pilhas soltas fora do programa (RF-07; spec 007, FR-003, FR-004; contracts/fora-do-programa.md).

function congelarFundo(valor) {
  if (valor && typeof valor === 'object') {
    for (const filho of Object.values(valor)) congelarFundo(filho);
    Object.freeze(valor);
  }
  return valor;
}

const marca = (blocoId) => ({ blocoId, mensagem: MENSAGEM_FORA_DO_PROGRAMA });

describe('blocosForaDoPrograma (RF-07, FR-003, FR-004)', () => {
  it('a mensagem fala da pilha', () => {
    expect(MENSAGEM_FORA_DO_PROGRAMA).toBe('Esta pilha está fora do programa');
  });

  it('projeto vazio não tem nada fora', () => {
    expect(blocosForaDoPrograma(projetoVazio().blocos)).toEqual([]);
  });

  it('comandos encaixados no programa não são marcados', () => {
    const projeto = projetoDeTeste({ comandos: [bloco('teste_comando'), bloco('teste_comando')] });
    expect(blocosForaDoPrograma(projeto.blocos)).toEqual([]);
  });

  it('dois blocos soltos depois do programa: um item por bloco, na ordem', () => {
    const projeto = projetoDeTeste({ soltos: [bloco('teste_comando', { id: 'a' }), bloco('teste_comando', { id: 'b' })] });
    const resultado = blocosForaDoPrograma(projeto.blocos);
    expect(resultado).toEqual([marca('a'), marca('b')]);
    for (const item of resultado) expect(Object.keys(item).sort()).toEqual(['blocoId', 'mensagem']);
  });

  it('bloco solto antes do programa na lista é marcado; o programa não', () => {
    const projeto = projetoVazio();
    projeto.blocos.blocks.blocks.unshift(bloco('teste_comando', { id: 'antes' }));
    expect(blocosForaDoPrograma(projeto.blocos)).toEqual([marca('antes')]);
  });

  it('pilha solta de 3 blocos gera um item só, o do topo', () => {
    const pilha = encadear([
      bloco('teste_comando', { id: 'topo' }),
      bloco('teste_comando', { id: 'meio' }),
      bloco('teste_comando', { id: 'fim' }),
    ]);
    const projeto = projetoDeTeste({ soltos: [pilha] });
    expect(blocosForaDoPrograma(projeto.blocos)).toEqual([marca('topo')]);
  });

  it('bloco solto com filhos em inputs gera um item só', () => {
    const solto = bloco('teste_bloco', { id: 'pai', entradas: { CORPO: [bloco('teste_comando', { id: 'filho' })] } });
    const projeto = projetoDeTeste({ soltos: [solto] });
    expect(blocosForaDoPrograma(projeto.blocos)).toEqual([marca('pai')]);
  });

  it('um segundo programa é marcado', () => {
    const projeto = projetoDeTeste({ soltos: [{ type: 'programa', id: 'programa-2' }] });
    expect(blocosForaDoPrograma(projeto.blocos)).toEqual([marca('programa-2')]);
  });

  it.each([[undefined], [null], [{}], [{ blocks: {} }], [{ blocks: { blocks: 'x' } }]])(
    'entrada ausente ou malformada devolve [] (%#)',
    (entrada) => {
      expect(blocosForaDoPrograma(entrada)).toEqual([]);
    },
  );

  it('item sem id de texto é ignorado', () => {
    const projeto = projetoDeTeste({
      soltos: [{ type: 'teste_comando' }, { type: 'teste_comando', id: 7 }, bloco('teste_comando', { id: 'ok' })],
    });
    expect(blocosForaDoPrograma(projeto.blocos)).toEqual([marca('ok')]);
  });

  it('100 blocos soltos geram 100 itens', () => {
    const soltos = Array.from({ length: 100 }, (_, i) => bloco('teste_comando', { id: `s${i}` }));
    expect(blocosForaDoPrograma(projetoDeTeste({ soltos }).blocos)).toHaveLength(100);
  });

  it('não modifica a entrada (entrada congelada não lança)', () => {
    const projeto = projetoDeTeste({ soltos: [bloco('teste_comando', { id: 'a' })] });
    const blocos = congelarFundo(projeto.blocos);
    expect(() => blocosForaDoPrograma(blocos)).not.toThrow();
    expect(blocosForaDoPrograma(blocos)).toEqual([marca('a')]);
  });
});
