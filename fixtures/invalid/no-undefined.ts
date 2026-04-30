type MaybePath = string | undefined;

export function readPath(path: MaybePath) {
  if (path === undefined) {
    return undefined;
  }

  return path;
}
