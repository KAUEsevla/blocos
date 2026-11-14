// Acumula as linhas do Portugol com indentação de 4 espaços por nível (RF-08, FR-003).
// Só LF, nunca tabulação, sem espaço no fim das linhas e com uma única quebra final.

const INDENTACAO = '    ';

export function criarEmissor() {
  const linhas = [];
  let nivel = 0;

  return {
    get nivel() {
      return nivel;
    },
    linha(texto) {
      const conteudo = String(texto).replace(/\s+$/, '');
      linhas.push(conteudo === '' ? '' : INDENTACAO.repeat(nivel) + conteudo);
    },
    linhaEmBranco() {
      linhas.push('');
    },
    entrar() {
      nivel += 1;
    },
    sair() {
      if (nivel === 0) throw new Error('O emissor já está no nível 0 de indentação.');
      nivel -= 1;
    },
    texto() {
      return `${linhas.join('\n')}\n`;
    },
  };
}
