export function formatFCFA(amount: number): string {
  // Format with space as thousands separator
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount).replace(/\u202F/g, ' '); // ensure clean non-breaking or standard space

  return `${formatted} FCFA`;
}

export function formatDate(dateString: string): string {
  // Format to Jour / Mois / Année (ex: 04/10/2024)
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
