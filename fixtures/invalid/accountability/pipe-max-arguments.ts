declare const value: {
  pipe: (...steps: Array<(input: unknown) => unknown>) => unknown;
};
declare const step: (input: unknown) => unknown;

export const piped = value.pipe(
  step,
  step,
  step,
  step,
  step,
  step,
  step,
  step,
  step,
  step,
  step,
  step,
  step,
  step,
  step,
  step,
  step,
  step,
  step,
  step,
  step,
);
