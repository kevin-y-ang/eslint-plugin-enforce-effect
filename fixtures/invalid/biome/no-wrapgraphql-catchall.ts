import { Effect, pipe } from "effect";

declare const wrapGraphqlCall: (query: string) => Effect.Effect<string>;
declare const handleError: (error: unknown) => Effect.Effect<string>;
declare const query: string;

pipe(wrapGraphqlCall(query), Effect.catchAll(handleError));
