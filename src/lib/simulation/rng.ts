// djb2 string hash → unsigned 32-bit integer seed for Mulberry32
function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 33) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

// Mulberry32: high-quality 32-bit PRNG. Returns uniform floats in [0, 1).
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  nextFloat(): number;
  // Box-Muller with pair caching: each pair of uniforms produces 2 independent standard normals.
  // The second normal is cached and returned on the next call. As a result, each nextNormal()
  // invocation consumes either 0 uniforms (cache hit) or 2 uniforms (cache miss) from the PRNG.
  // The cache is part of this Rng object's state — deterministic for any given seed.
  nextNormal(): number;
}

export function createRng(seed: string): Rng {
  const next = mulberry32(djb2(seed));
  let cachedNormal: number | null = null;

  return {
    nextFloat: next,
    nextNormal(): number {
      if (cachedNormal !== null) {
        const z = cachedNormal;
        cachedNormal = null;
        return z;
      }
      // Guard against log(0): Mulberry32 can output 0 / 4294967296 = 0 in theory.
      const u1 = Math.max(Number.EPSILON, next());
      const u2 = next();
      const mag = Math.sqrt(-2 * Math.log(u1));
      const z1 = mag * Math.cos(2 * Math.PI * u2);
      const z2 = mag * Math.sin(2 * Math.PI * u2);
      cachedNormal = z2;
      return z1;
    },
  };
}
