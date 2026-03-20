declare namespace Temporal {
  interface Instant {
    readonly epochMilliseconds: number;
    toString(): string;
  }

  interface InstantConstructor {
    from(value: string): Instant;
  }

  interface Now {
    instant(): Instant;
  }
}

declare const Temporal: {
  Instant: Temporal.InstantConstructor;
  Now: Temporal.Now;
};
