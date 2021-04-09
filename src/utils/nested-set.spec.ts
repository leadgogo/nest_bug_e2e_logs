import { NestedSetNode, findAncestors } from './nested-set';

describe('Nested Set utils', () => {
  const nodes: NestedSetNode[] = [
    { level: 0, lft: 201, rgt: 300 },
    { level: 5, lft: 230, rgt: 240 },
    { level: 8, lft: 233, rgt: 238 },
    { level: 10, lft: 235, rgt: 236 },

    { level: 0, lft: 201, rgt: 300 }, // repeated

    { level: 0, lft: 50, rgt: 200 },
    { level: 4, lft: 100, rgt: 180 },
  ];
  describe('findAncestors', () => {
    it('finds the correct ancestors for subject A', () => {
      const subject: NestedSetNode = { level: 9, lft: 234, rgt: 237 };
      const expected: NestedSetNode[] = [
        { level: 8, lft: 233, rgt: 238 },
        { level: 5, lft: 230, rgt: 240 },
        { level: 0, lft: 201, rgt: 300 },
        { level: 0, lft: 201, rgt: 300 },
      ];
      expect(findAncestors(subject, nodes)).toEqual(expected);
    });
    it('finds the correct ancestors for subject B', () => {
      const subject: NestedSetNode = { level: 5, lft: 110, rgt: 170 };
      const expected: NestedSetNode[] = [
        { level: 4, lft: 100, rgt: 180 },
        { level: 0, lft: 50, rgt: 200 },
      ];
      expect(findAncestors(subject, nodes)).toEqual(expected);
    });
    it('finds the correct ancestors for subject C', () => {
      const subject: NestedSetNode = { level: 8, lft: 233, rgt: 238 };
      const expected: NestedSetNode[] = [
        { level: 8, lft: 233, rgt: 238 },
        { level: 5, lft: 230, rgt: 240 },
        { level: 0, lft: 201, rgt: 300 },
        { level: 0, lft: 201, rgt: 300 },
      ];
      expect(findAncestors(subject, nodes)).toEqual(expected);
    });
    it('finds the correct ancestors for subject D', () => {
      const subject: NestedSetNode = { level: 8, lft: 233, rgt: 238 };
      const expected: NestedSetNode[] = [
        { level: 5, lft: 230, rgt: 240 },
        { level: 0, lft: 201, rgt: 300 },
        { level: 0, lft: 201, rgt: 300 },
      ];
      expect(findAncestors(subject, nodes, false)).toEqual(expected);
    });
    it('finds the correct ancestors for subject E', () => {
      const subject: NestedSetNode = { level: 3, lft: 351, rgt: 353 };
      const expected: NestedSetNode[] = [];
      expect(findAncestors(subject, nodes)).toEqual(expected);
    });
  });
});
