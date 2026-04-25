import { Effect } from "effect";

declare const getUserId: Effect.Effect<string>;
declare const fetchUser: (id: string) => Effect.Effect<{ profile: string }>;

export const loadUser = Effect.map(
  Effect.flatMap(getUserId, (userId) => fetchUser(userId)),
  (user) => user.profile,
);
