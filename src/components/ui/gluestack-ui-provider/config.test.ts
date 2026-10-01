import { colors } from './config';

describe('gluestack provider colors', () => {
  it('maps gluestack tokens onto the design-system palette', () => {
    expect(colors.light['--primary']).toBe('93 28 52'); // primaryContainer #5D1C34
    expect(colors.light['--primary-strong']).toBe('65 5 31'); // primary #41051F
    expect(colors.light['--background']).toBe('251 249 247'); // surface #FBF9F7
    expect(colors.light['--muted-foreground']).toBe('100 93 92'); // secondary #645D5C
  });

  it('produces a valid "R G B" triplet for every variable', () => {
    for (const [name, value] of Object.entries(colors.light)) {
      expect([name, value]).toEqual([name, expect.stringMatching(/^\d{1,3} \d{1,3} \d{1,3}$/)]);
    }
  });
});
