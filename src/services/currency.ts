import { CurrencyInfo } from '../types';

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2, flag: '🇬🇧' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2, flag: '🇮🇳' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0, flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2, flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimals: 2, flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2, flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2, flag: '🇨🇳' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimals: 2, flag: '🇸🇬' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', decimals: 2, flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', decimals: 2, flag: '🇸🇦' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimals: 2, flag: '🇳🇿' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimals: 2, flag: '🇭🇰' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimals: 2, flag: '🇸🇪' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimals: 0, flag: '🇰🇷' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimals: 2, flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', decimals: 2, flag: '🇲🇽' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimals: 2, flag: '🇿🇦' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', decimals: 2, flag: '🇹🇭' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimals: 2, flag: '🇲🇾' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimals: 0, flag: '🇮🇩' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', decimals: 2, flag: '🇹🇷' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', decimals: 2, flag: '🇵🇱' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimals: 2, flag: '🇩🇰' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimals: 2, flag: '🇳🇴' },
  { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', decimals: 2, flag: '🇮🇱' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimals: 2, flag: '🇵🇭' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', decimals: 2, flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', decimals: 0, flag: '🇭🇺' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR', decimals: 2, flag: '🇶🇦' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', decimals: 3, flag: '🇰🇼' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', decimals: 3, flag: '🇧🇭' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR', decimals: 3, flag: '🇴🇲' },
];

export const CURRENCY_MAP = new Map<string, CurrencyInfo>(
  SUPPORTED_CURRENCIES.map(c => [c.code, c])
);

export function getCurrencyInfo(code: string): CurrencyInfo {
  return CURRENCY_MAP.get(code) || {
    code,
    name: code,
    symbol: code,
    decimals: 2,
    flag: '🌐'
  };
}

// Default baseline rates relative to USD if offline or initial load
const BASE_RATES_CACHE_KEY = 'spendly_exchange_rates_cache';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours cache

export interface ExchangeRatesData {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

// Fallback rates if network is unavailable on first boot
const DEFAULT_USD_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 86.5,
  JPY: 154.2,
  AUD: 1.54,
  CAD: 1.41,
  CHF: 0.89,
  CNY: 7.24,
  SGD: 1.34,
  AED: 3.6725,
  SAR: 3.75,
  NZD: 1.71,
  HKD: 7.78,
  SEK: 10.65,
  KRW: 1420.0,
  BRL: 5.75,
  MXN: 20.35,
  ZAR: 18.25,
  THB: 33.85,
  MYR: 4.45,
  IDR: 16200.0,
  TRY: 35.8,
  PLN: 3.98,
  DKK: 6.87,
  NOK: 10.82,
  ILS: 3.65,
  PHP: 57.8,
  CZK: 23.2,
  HUF: 375.0,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.377,
  OMR: 0.385
};

let memoryRates: ExchangeRatesData = {
  base: 'USD',
  rates: { ...DEFAULT_USD_RATES },
  timestamp: Date.now()
};

export async function fetchLiveExchangeRates(forceRefresh = false): Promise<ExchangeRatesData> {
  try {
    const cached = localStorage.getItem(BASE_RATES_CACHE_KEY);
    if (cached && !forceRefresh) {
      const parsed = JSON.parse(cached) as ExchangeRatesData;
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        memoryRates = parsed;
        return parsed;
      }
    }

    // Free Open Exchange Rate API without key
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (response.ok) {
      const data = await response.json();
      if (data && data.rates) {
        const result: ExchangeRatesData = {
          base: 'USD',
          rates: data.rates,
          timestamp: Date.now()
        };
        memoryRates = result;
        localStorage.setItem(BASE_RATES_CACHE_KEY, JSON.stringify(result));
        return result;
      }
    }
  } catch (err) {
    console.warn('Could not fetch live exchange rates, using cached/fallback rates:', err);
  }

  // Fallback to cache if present, else default
  const cached = localStorage.getItem(BASE_RATES_CACHE_KEY);
  if (cached) {
    try {
      memoryRates = JSON.parse(cached);
      return memoryRates;
    } catch {
      // ignore
    }
  }

  return memoryRates;
}

/**
 * Calculates exchange rate from fromCurrency to toCurrency
 * Returns: How many units of toCurrency per 1 unit of fromCurrency
 */
export function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  ratesData: ExchangeRatesData = memoryRates
): number {
  if (fromCurrency === toCurrency) return 1.0;

  const rates = ratesData.rates || DEFAULT_USD_RATES;
  const fromRateInUSD = rates[fromCurrency] || 1.0;
  const toRateInUSD = rates[toCurrency] || 1.0;

  // Since all rates are relative to USD:
  // 1 USD = fromRateInUSD [FROM] => 1 [FROM] = 1 / fromRateInUSD USD
  // 1 [FROM] = (1 / fromRateInUSD) * toRateInUSD [TO] = toRateInUSD / fromRateInUSD
  const rate = toRateInUSD / fromRateInUSD;
  return Number(rate.toFixed(6));
}

/**
 * Converts an amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate?: number
): number {
  if (fromCurrency === toCurrency) return amount;
  const effectiveRate = rate !== undefined ? rate : getExchangeRate(fromCurrency, toCurrency);
  const info = getCurrencyInfo(toCurrency);
  const converted = amount * effectiveRate;
  return Number(converted.toFixed(info.decimals));
}

/**
 * Formats currency nicely according to ISO standard and decimal count
 */
export function formatCurrency(
  amount: number | null | undefined,
  currencyCode: string = 'USD',
  options?: {
    showCode?: boolean;
    useGrouping?: boolean;
    locale?: string;
  }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }

  const info = getCurrencyInfo(currencyCode);
  const locale = options?.locale || (currencyCode === 'INR' ? 'en-IN' : 'en-US');

  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: info.decimals,
      useGrouping: options?.useGrouping !== false,
    }).format(amount);

    if (options?.showCode && !formatted.includes(currencyCode)) {
      return `${formatted} ${currencyCode}`;
    }
    return formatted;
  } catch {
    // Fallback if Intl fails on custom currency
    const fixed = amount.toFixed(info.decimals);
    return `${info.symbol}${fixed}${options?.showCode ? ` ${currencyCode}` : ''}`;
  }
}
