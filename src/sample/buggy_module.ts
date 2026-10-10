// Auto-generated self-healed patch by NeatPatch
export function calculateMetrics(values: number[]): { average: number; count: number } {
  if (!values || values.length === 0) {
    return { average: 0, count: 0 };
  }
  const sum = values.reduce((a, b) => a + b, 0);
  return { average: sum / values.length, count: values.length };
}
