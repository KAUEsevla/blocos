// Bloqueio de execução por blocos incompletos (RF-08, FR-006). A spec 009 consulta esta
// função antes de rodar; com avisos, nada é enviado ao Core (SC-003).

const MOTIVO_BLOQUEIO = 'O programa tem blocos incompletos. Complete-os para executar.';

export function verificarExecucao({ avisos = [] }) {
  if (avisos.length === 0) return { permitida: true, motivo: null, avisos: [] };
  return { permitida: false, motivo: MOTIVO_BLOQUEIO, avisos: [...avisos] };
}
