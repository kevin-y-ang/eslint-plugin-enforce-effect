import { Layer } from "effect";

declare const Base: Layer.Layer<unknown>;
declare const Dependency: Layer.Layer<unknown>;
declare const Other: Layer.Layer<unknown>;

export const composed = Layer.provide(Base, Layer.provide(Dependency, Other));
