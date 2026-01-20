export class RandomLCG {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    /**
     * Returns a pseudorandom float between 0 and 1.
     */
    next(): number {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }

    /**
     * Returns a pseudorandom float between min and max.
     */
    range(min: number, max: number): number {
        return min + this.next() * (max - min);
    }
}
