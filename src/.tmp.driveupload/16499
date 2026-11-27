export function normalizarDataIso(valor) {
  if (!valor) return '';
  return String(valor).trim().split('T')[0];
}

export function isDiaBloqueadoParaProfissional(bloqueios = [], dataIso, barbId) {
  const dataFmt = normalizarDataIso(dataIso);
  if (!dataFmt || !Array.isArray(bloqueios)) return false;

  return bloqueios.some((b) => {
    const dataBloqFmt = normalizarDataIso(b.data_bloqueio);
    if (dataBloqFmt !== dataFmt) return false;

    const bloqueioGeral =
      b.barbeiro_id === null ||
      b.barbeiro_id === undefined ||
      String(b.barbeiro_id).trim() === '';

    if (bloqueioGeral) return true;
    if (!barbId) return false;

    return String(b.barbeiro_id) === String(barbId);
  });
}