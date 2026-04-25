import { Effect } from "effect";

declare const MyService: unknown;

export const probe = Effect.serviceOption(MyService);
