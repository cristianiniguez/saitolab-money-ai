import Papa from 'papaparse'

export interface ParseCsvResult<T> {
  rows: T[]
  headerErrors: string[]
}

export function parseCsv<T extends Record<string, string>>(
  file: File,
  requiredHeaders: string[]
): Promise<ParseCsvResult<T>> {
  return new Promise(resolve => {
    Papa.parse<T>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const actualHeaders = results.meta.fields ?? []
        const missing = requiredHeaders.filter(h => !actualHeaders.includes(h))
        if (missing.length > 0) {
          resolve({
            rows: [],
            headerErrors: [`Missing required columns: ${missing.join(', ')}`]
          })
          return
        }
        resolve({ rows: results.data, headerErrors: [] })
      },
      error(err) {
        resolve({ rows: [], headerErrors: [err.message] })
      }
    })
  })
}
