import { describe, it, expect } from 'vitest';
import { criarRegistro, registroPadrao } from '../../src/blocos/registro.js';

const base = () => ({
  tipo: 'teste',
  rotulo: 'teste',
  categoria: 'comando',
  definicao: { type: 'teste' },
  gerar: () => {},
});

describe('registro de blocos (RF-08)', () => {
  it('começa vazio', () => {
    expect(criarRegistro().tiposRegistrados()).toEqual([]);
  });

  it('registra e devolve a entrada com padrões para areas e variantes', () => {
    const r = criarRegistro();
    r.registrarBloco(base());
    const entrada = r.obter('teste');
    expect(entrada.rotulo).toBe('teste');
    expect(entrada.areas).toEqual([]);
    expect(entrada.variantes).toEqual([]);
    expect(r.obter('outro')).toBeUndefined();
  });

  it.each(['tipo', 'rotulo', 'categoria', 'definicao', 'gerar'])('exige o campo %s', (campo) => {
    const entrada = base();
    delete entrada[campo];
    expect(() => criarRegistro().registrarBloco(entrada)).toThrow(campo);
  });

  it('só aceita as categorias comando, valor e raiz', () => {
    const r = criarRegistro();
    for (const categoria of ['comando', 'valor', 'raiz']) {
      r.registrarBloco({ ...base(), tipo: categoria, categoria });
    }
    expect(() => r.registrarBloco({ ...base(), tipo: 'x', categoria: 'outra' })).toThrow('categoria');
  });

  it('valida areas e variantes', () => {
    const r = criarRegistro();
    expect(() => r.registrarBloco({ ...base(), areas: 'CORPO' })).toThrow('areas');
    expect(() => r.registrarBloco({ ...base(), areas: [1] })).toThrow('areas');
    expect(() => r.registrarBloco({ ...base(), variantes: {} })).toThrow('variantes');
    expect(() => r.registrarBloco({ ...base(), variantes: [{ nome: 'a' }] })).toThrow('presente');
    expect(() => r.registrarBloco({ ...base(), variantes: [{ presente: () => true }] })).toThrow('nome');
    expect(() =>
      r.registrarBloco({
        ...base(),
        variantes: [
          { nome: 'a', presente: () => true },
          { nome: 'a', presente: () => false },
        ],
      }),
    ).toThrow('repetid');
  });

  it('recusa tipo duplicado', () => {
    const r = criarRegistro();
    r.registrarBloco(base());
    expect(() => r.registrarBloco(base())).toThrow('teste');
  });

  it('lista os tipos na ordem de registro', () => {
    const r = criarRegistro();
    r.registrarBloco({ ...base(), tipo: 'b' });
    r.registrarBloco({ ...base(), tipo: 'a' });
    expect(r.tiposRegistrados()).toEqual(['b', 'a']);
  });

  it('variantesDe devolve as declaradas ou a variante implícita "padrão"', () => {
    const r = criarRegistro();
    const presente = (b) => b.fields?.OP === '+';
    r.registrarBloco({ ...base(), tipo: 'op', variantes: [{ nome: '+', presente }] });
    r.registrarBloco({ ...base(), tipo: 'simples' });
    expect(r.variantesDe('op')).toEqual([{ nome: '+', presente }]);
    const [padrao] = r.variantesDe('simples');
    expect(padrao.nome).toBe('padrão');
    expect(padrao.presente({})).toBe(true);
    expect(() => r.variantesDe('inexistente')).toThrow('inexistente');
  });

  it('o registro padrão contém o bloco programa', () => {
    const programa = registroPadrao.obter('programa');
    expect(programa.categoria).toBe('raiz');
    expect(programa.areas).toEqual(['COMANDOS']);
    expect(programa.variantes).toEqual([]);
  });
});
