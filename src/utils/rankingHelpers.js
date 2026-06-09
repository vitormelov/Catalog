/**
 * Atribui colocações com empate (competition ranking).
 * Ex.: notas 10, 10, 9, 8 → colocações 1, 1, 3, 4
 */
export const assignRanks = (items) => {
  const rated = items
    .filter((item) => item.rating > 0)
    .sort((a, b) => b.rating - a.rating);

  const result = [];
  for (let i = 0; i < rated.length; i++) {
    let rank;
    if (i === 0) {
      rank = 1;
    } else if (rated[i].rating < rated[i - 1].rating) {
      rank = i + 1;
    } else {
      rank = result[i - 1].rank;
    }
    result.push({ ...rated[i], rank });
  }
  return result;
};

export const getRankLabel = (rank) => `${rank}º`;
