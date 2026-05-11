function double(n: number) {
  return n * 2;
}

const doubleResult = double(2);

const triple = (n: number) => n * 3;

const tripleResult = triple(3);

const quadrupleResult = ((n: number) => n * 4)(4);

const square = function (n: number) {
  return n * n;
};

const squareResult = square(5);

const greet = (name: string) => {
  const trimmed = name.trim();
  return `hello ${trimmed}`;
};

const greeting = greet("world");

export const exported = {
  doubleResult,
  tripleResult,
  quadrupleResult,
  squareResult,
  greeting,
};
