export function calculateLeanBodyMassKg(weightKg: number, bodyFatPercent: number) {
  const lean = weightKg * (1 - bodyFatPercent / 100);

  return Math.round(lean * 10) / 10;
}

export function averageLatestWeights(weightsNewestFirst: number[], sampleSize = 7) {
  const sample = weightsNewestFirst.filter((weight) => weight > 0).slice(0, sampleSize);

  if (sample.length === 0) {
    return null;
  }

  const total = sample.reduce((sum, weight) => sum + weight, 0);

  return Math.round((total / sample.length) * 10) / 10;
}
