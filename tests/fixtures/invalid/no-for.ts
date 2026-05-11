export function visit(items: ReadonlyArray<string>) {
  for (const item of items) {
    consume(item);
  }
}
