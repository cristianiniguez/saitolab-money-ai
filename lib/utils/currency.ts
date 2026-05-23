export function convertCurrency(
  amount: number,
  fromRateUsd: number,
  toRateUsd: number
): number {
  if (fromRateUsd === 0) return 0
  return amount * (toRateUsd / fromRateUsd)
}
