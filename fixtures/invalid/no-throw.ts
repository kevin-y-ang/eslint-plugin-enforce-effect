export function parsePort(value: string) {
  if (value.length === 0) {
    throw new Error("Missing port");
  }

  return Number(value);
}
