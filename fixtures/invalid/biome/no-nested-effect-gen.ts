import { Effect } from "effect";

declare const getUser: Effect.Effect<{ id: string }>;
declare const createTrade: (id: string) => Effect.Effect<{ value: number }>;
declare const persistTrade: (trade: { value: number }) => Effect.Effect<void>;

export const saveTrade = Effect.gen(function* () {
  const user = yield* getUser;
  return yield* Effect.gen(function* () {
    const trade = yield* createTrade(user.id);
    return yield* persistTrade(trade);
  });
});
