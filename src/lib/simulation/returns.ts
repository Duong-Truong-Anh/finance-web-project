/**
 * Lognormal monthly return for a single stock.
 *
 * r = exp( (μ/12 − σ²/24) + (σ/√12) · Z ) − 1
 *
 * The σ²/24 Itô correction ensures the expected compound return equals μ:
 * E[ln(1+r)] = μ/12 − σ²/24, and Var[ln(1+r)] = σ²/12, so
 * E[1+r] = exp(μ/12) exactly.
 *
 * @param mu    Expected annual return as a decimal (e.g. 0.18 for 18%)
 * @param sigma Annual return standard deviation as a decimal (e.g. 0.28 for 28%)
 * @param Z     Standard normal random variable (draw from createRng().nextNormal())
 * @returns     Monthly return as a decimal (e.g. 0.015 means +1.5%)
 */
export function lognormalMonthlyReturn(mu: number, sigma: number, Z: number): number {
  return Math.exp((mu / 12 - (sigma * sigma) / 24) + (sigma / Math.sqrt(12)) * Z) - 1;
}
