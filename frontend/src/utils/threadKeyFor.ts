export function threadKeyFor(a: number, b: number): string {
  const [low, high] = a < b ? [a, b] : [b, a];
  return `thread-${low}-${high}`;
}