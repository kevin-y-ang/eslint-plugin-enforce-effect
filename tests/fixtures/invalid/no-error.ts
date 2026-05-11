type Failure = Error;

export function fail() {
  return new Error("boom");
}
