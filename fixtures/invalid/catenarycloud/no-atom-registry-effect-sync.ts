import { Effect } from "effect";
import { Atom } from "@effect-atom/atom-react";

declare const userAtom: Atom.Writable<number, number>;

Effect.sync(() => Atom.set(userAtom, 1));
