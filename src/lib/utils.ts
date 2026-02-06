import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { City, Country, State } from 'country-state-city'
import getSymbolFromCurrency from 'currency-symbol-map'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStripeOAuthLink(
  accountType: 'agency' | 'subaccount',
  state: string
) {
  return `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID}&scope=read_write&redirect_uri=${process.env.NEXT_PUBLIC_URL}${accountType}&state=${state}`
}


export function formatCurrency(amount: number, currency: string = 'MYR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export const getCountries = () => {
  const countries = Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name))
  return countries.map((country) => ({
    name: country.name,
    isoCode: country.isoCode,
    phoneCode: country.phonecode,
    currency: country.currency,
    currencySymbol: getSymbolFromCurrency(country.currency),
    currencyFormat: formatCurrency(0, country.currency),
  }))

}

