import { capitalCase } from 'change-case';
import { Locales } from 'locale';

type LocalizedProperty<T extends string> = `${T}${'En' | 'Es'}`;

export function localizeProperty<T extends string>(
  propertyName: T,
  locale: string
): LocalizedProperty<T> {
  const required = new Locales(locale, 'en');
  const lang = required.best(new Locales(['en', 'es'])).language;
  const result = `${propertyName}${capitalCase(lang)}`;
  return result as LocalizedProperty<T>;
}
