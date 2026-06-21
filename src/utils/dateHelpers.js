/**
 * Date-only strings (YYYY-MM-DD) from <input type="date"> are parsed as UTC by
 * the JS Date constructor, which shifts the day in negative UTC offsets (e.g. Brazil).
 */
export const parseLocalDate = (dateString) => {
  if (!dateString) return null;

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatLocalDate = (dateString, fallback = '—') => {
  const date = parseLocalDate(dateString);
  if (!date) return fallback;
  return date.toLocaleDateString('pt-BR');
};

export const formatLocalDateTime = (dateString, fallback = '—') => {
  if (!dateString) return fallback;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
