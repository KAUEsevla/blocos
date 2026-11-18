// Entrega um texto como arquivo baixado (RF-11; spec 011, contracts/tela-salvar.md; research
// R-06). O arquivo nasce no navegador: nenhum envio a servidor (FR-004).
// Interface, fora da cobertura.

export function baixarArquivo(nomeArquivo, texto) {
  const url = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  // Revogar depois do clique: o navegador já começou o download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
