export interface NestedSetNode {
  lft: number;
  rgt: number;
  level: number;
}

export function findAncestors<T extends NestedSetNode>(
  subject: NestedSetNode,
  nodes: T[],
  inclusive = true
) {
  const sortedSet = nodes.sort((a, b) => b.level - a.level);
  const ancestors: T[] = [];
  let currentSubject: NestedSetNode = subject;
  let haystack: T[] = sortedSet;
  while (haystack.length > 0) {
    const index = haystack.findIndex(
      (possibleAncestor) =>
        possibleAncestor.lft <= currentSubject.lft &&
        currentSubject.rgt <= possibleAncestor.rgt &&
        possibleAncestor.level <= currentSubject.level
    );
    if (index === -1) {
      break;
    }
    const ancestor = haystack[index];
    if (inclusive || subject.level > ancestor.level) {
      ancestors.push(ancestor);
    }
    currentSubject = ancestor;
    haystack = haystack.slice(index + 1);
  }
  return ancestors;
}
