export function readTag(tag: string) {
  switch (tag) {
    case "ready":
      return 1;
    default:
      return 0;
  }
}
