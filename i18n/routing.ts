import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: [
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
  ],
  defaultLocale: 'en'
});
