import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = [
  'en',    // English
  'es',    // Spanish
  'pt-BR', // Brazilian Portuguese
  'fr',    // French
  'de',    // German
  'ru',    // Russian
  'ko',    // Korean
  'ja',    // Japanese
  'zh-CN', // Chinese Simplified
  'zh-TW', // Chinese Traditional
  'hi',    // Hindi
  'bn',    // Bengali
  'ta',    // Tamil
  'te',    // Telugu
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    locale: locale as string,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
