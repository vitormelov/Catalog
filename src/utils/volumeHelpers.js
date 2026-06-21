export const VOLUME_CONDITIONS = [
  { value: 'lacrado', label: 'Lacrado' },
  { value: 'novo', label: 'Novo' },
  { value: 'levemente_danificado', label: 'Levemente danificado' },
  { value: 'danificado', label: 'Danificado' },
  { value: 'bastante_danificado', label: 'Bastante danificado' },
];

export const getVolumeCondition = (volume) => {
  if (volume?.condition) return volume.condition;
  if (volume?.state === 'lacrado') return 'lacrado';
  return 'novo';
};

export const getConditionLabel = (condition) =>
  VOLUME_CONDITIONS.find((c) => c.value === condition)?.label || condition;

export const normalizeVolume = (vol) => ({
  volumeNumber: Number(vol.volumeNumber),
  condition: getVolumeCondition(vol),
  price: Number(vol.price) || 0,
  purchaseDate: vol.purchaseDate || null,
  lastUpdated: vol.lastUpdated || null,
});
