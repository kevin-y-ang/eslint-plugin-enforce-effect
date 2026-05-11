export const label = maybeLabel ?? "fallback";

export let cached;
cached ??= computeIt();
