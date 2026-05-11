type MaybeName = string | { _tag: "MissingName" };

export function normalizeName(input: MaybeName) {
  if (typeof input === "string") {
    return input.trim();
  }

  return "anonymous";
}
