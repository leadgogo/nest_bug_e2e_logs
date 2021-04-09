import { localizeProperty } from 'src/utils/i18n/localize-property';

describe('localize property', () => {
  it('name, es_ES returns nameEs', () => {
    expect(localizeProperty('name', 'es_ES')).toBe('nameEs');
  });
  it('name, en_US returns nameEn', () => {
    expect(localizeProperty('name', 'en_US')).toBe('nameEn');
  });
});
