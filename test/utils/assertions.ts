export function expectIsDefined<T>(
  thing: T
): asserts thing is Exclude<T, undefined | null> {
  expect(thing).toBeDefined();
  expect(thing).not.toBeNull();
}
