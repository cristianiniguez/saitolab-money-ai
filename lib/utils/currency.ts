export function convertCurrency(
  amount: number,
  fromRateUsd: number,
  toRateUsd: number
): number {
  if (fromRateUsd === 0) return 0
  return amount * (toRateUsd / fromRateUsd)
}

// Formats with the currency's symbol code (e.g. BOB, USD); codes Intl rejects (e.g. USDT) fall back to "CODE 1.23".
export function formatMoney(amount: number, currencySymbol = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { currency: currencySymbol, style: 'currency' }).format(amount)
  }
  catch {
    return `${currencySymbol} ${amount.toFixed(2)}`
  }
}
