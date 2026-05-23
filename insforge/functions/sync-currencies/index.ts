declare const Deno: { env: { get(key: string): string | undefined } }

const FIAT_NAMES: Record<string, string> = {
  AED: 'UAE Dirham',
  ARS: 'Argentine Peso',
  AUD: 'Australian Dollar',
  BDT: 'Bangladeshi Taka',
  BOB: 'Bolivian Boliviano',
  BRL: 'Brazilian Real',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  CLP: 'Chilean Peso',
  CNY: 'Chinese Yuan',
  COP: 'Colombian Peso',
  CZK: 'Czech Koruna',
  DKK: 'Danish Krone',
  EGP: 'Egyptian Pound',
  EUR: 'Euro',
  GBP: 'British Pound',
  HKD: 'Hong Kong Dollar',
  HUF: 'Hungarian Forint',
  IDR: 'Indonesian Rupiah',
  ILS: 'Israeli Shekel',
  INR: 'Indian Rupee',
  JPY: 'Japanese Yen',
  KRW: 'South Korean Won',
  KWD: 'Kuwaiti Dinar',
  MXN: 'Mexican Peso',
  MYR: 'Malaysian Ringgit',
  NGN: 'Nigerian Naira',
  NOK: 'Norwegian Krone',
  NZD: 'New Zealand Dollar',
  PEN: 'Peruvian Sol',
  PHP: 'Philippine Peso',
  PKR: 'Pakistani Rupee',
  PLN: 'Polish Zloty',
  QAR: 'Qatari Riyal',
  RON: 'Romanian Leu',
  RUB: 'Russian Ruble',
  SAR: 'Saudi Riyal',
  SEK: 'Swedish Krona',
  SGD: 'Singapore Dollar',
  THB: 'Thai Baht',
  TRY: 'Turkish Lira',
  UAH: 'Ukrainian Hryvnia',
  USD: 'US Dollar',
  VND: 'Vietnamese Dong',
  ZAR: 'South African Rand'
}

const CRYPTO_IDS = [
  'aave',
  'algorand',
  'aptos',
  'arbitrum',
  'avalanche-2',
  'binancecoin',
  'bitcoin',
  'bitcoin-cash',
  'cardano',
  'chainlink',
  'cosmos',
  'dai',
  'dogecoin',
  'ethereum',
  'ethereum-classic',
  'fantom',
  'filecoin',
  'hedera-hashgraph',
  'injective-protocol',
  'internet-computer',
  'kaspa',
  'litecoin',
  'maker',
  'monero',
  'near',
  'okb',
  'optimism',
  'pepe',
  'polkadot',
  'render-token',
  'ripple',
  'sei-network',
  'shiba-inu',
  'solana',
  'stacks',
  'stellar',
  'sui',
  'tether',
  'the-graph',
  'tron',
  'uniswap',
  'usd-coin',
  'vechain'
]

interface CurrencyRow {
  name: string
  rate_usd: number
  slug: string
  symbol: string
  type: 'fiat' | 'crypto'
}

async function syncCurrencies(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': '*'
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    const [fiatRes, cryptoRes] = await Promise.all([
      fetch('https://open.er-api.com/v6/latest/USD'),
      fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CRYPTO_IDS.join(',')}`
      )
    ])

    if (!fiatRes.ok) throw new Error(`Fiat API error: ${fiatRes.status}`)
    if (!cryptoRes.ok) throw new Error(`Crypto API error: ${cryptoRes.status}`)

    const fiatData = await fiatRes.json()
    const cryptoData = await cryptoRes.json()

    const rows: CurrencyRow[] = []

    for (const [code, rate] of Object.entries(fiatData.rates as Record<string, number>)) {
      if (!FIAT_NAMES[code]) continue
      rows.push({
        name: FIAT_NAMES[code],
        rate_usd: rate,
        slug: code.toLowerCase(),
        symbol: code,
        type: 'fiat'
      })
    }

    for (const coin of cryptoData) {
      if (!coin.current_price || coin.current_price <= 0) continue
      rows.push({
        name: coin.name,
        rate_usd: 1 / coin.current_price,
        slug: coin.id,
        symbol: coin.symbol.toUpperCase(),
        type: 'crypto'
      })
    }

    const baseUrl = Deno.env.get('INSFORGE_BASE_URL')
    const apiKey = Deno.env.get('API_KEY')

    const formData = new FormData()
    const blob = new Blob([JSON.stringify(rows)], { type: 'application/json' })
    formData.append('file', blob, 'currencies.json')
    formData.append('table', 'currencies')
    formData.append('upsertKey', 'slug')

    const dbRes = await fetch(`${baseUrl}/api/database/advance/bulk-upsert`, {
      body: formData,
      headers: { Authorization: `Bearer ${apiKey}` },
      method: 'POST'
    })

    if (!dbRes.ok) {
      const body = await dbRes.text()
      throw new Error(`Bulk upsert error ${dbRes.status}: ${body}`)
    }

    return new Response(
      JSON.stringify({ ok: true, synced: rows.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ error: message, ok: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

export default syncCurrencies
