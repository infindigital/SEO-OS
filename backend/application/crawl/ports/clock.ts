/** Port supplying the current time, so crawl timing is deterministic in tests. */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};
