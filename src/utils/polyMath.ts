// ============================================================
// polyMath.ts  –  All polynomial regression calculations
// Mirrors what NumPy / scikit-learn do in Python:
//   np.polyfit  →  leastSquaresFit
//   np.polyval  →  polyEval
//   r2_score    →  rSquared
// ============================================================

/** Evaluate polynomial (highest-degree coefficient first, like NumPy) */
export function polyEval(coeffs: number[], x: number): number {
  return coeffs.reduce((acc, c) => acc * x + c, 0);
}

/** Vandermonde matrix column-major, degree = coeffs.length-1 */
function vandermondeMatrix(xs: number[], degree: number): number[][] {
  return xs.map((x) => {
    const row: number[] = [];
    for (let d = degree; d >= 0; d--) row.push(Math.pow(x, d));
    return row;
  });
}

/** Solve normal equations: (VᵀV) β = Vᵀy  using Gaussian elimination */
function solveNormalEquations(V: number[][], y: number[]): number[] {
  const deg1 = V[0].length;
  // Build Vᵀ V  and  Vᵀ y
  const VtV: number[][] = Array.from({ length: deg1 }, () => new Array(deg1).fill(0));
  const Vty: number[] = new Array(deg1).fill(0);
  for (let i = 0; i < V.length; i++) {
    for (let j = 0; j < deg1; j++) {
      Vty[j] += V[i][j] * y[i];
      for (let k = 0; k < deg1; k++) {
        VtV[j][k] += V[i][j] * V[i][k];
      }
    }
  }
  // Augmented matrix [VtV | Vty]
  const aug: number[][] = VtV.map((row, i) => [...row, Vty[i]]);
  // Forward elimination
  for (let col = 0; col < deg1; col++) {
    let maxRow = col;
    for (let r = col + 1; r < deg1; r++)
      if (Math.abs(aug[r][col]) > Math.abs(aug[maxRow][col])) maxRow = r;
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) continue;
    for (let r = col + 1; r < deg1; r++) {
      const factor = aug[r][col] / pivot;
      for (let c = col; c <= deg1; c++) aug[r][c] -= factor * aug[col][c];
    }
  }
  // Back substitution
  const beta = new Array(deg1).fill(0);
  for (let r = deg1 - 1; r >= 0; r--) {
    let sum = aug[r][deg1];
    for (let c = r + 1; c < deg1; c++) sum -= aug[r][c] * beta[c];
    beta[r] = Math.abs(aug[r][r]) < 1e-12 ? 0 : sum / aug[r][r];
  }
  return beta;
}

/** Fit polynomial of given degree to (xs, ys). Returns coefficients high→low */
export function polyFit(xs: number[], ys: number[], degree: number): number[] {
  const V = vandermondeMatrix(xs, degree);
  return solveNormalEquations(V, ys);
}

/** R² (coefficient of determination) */
export function rSquared(ys: number[], yHat: number[]): number {
  const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
  const ssTot = ys.reduce((s, y) => s + (y - mean) ** 2, 0);
  const ssRes = ys.reduce((s, y, i) => s + (y - yHat[i]) ** 2, 0);
  return ssTot === 0 ? 1 : 1 - ssRes / ssTot;
}

/** Adjusted R² */
export function adjR2(r2: number, n: number, p: number): number {
  return 1 - (1 - r2) * ((n - 1) / (n - p - 1));
}

/** Root Mean Square Error */
export function rmse(ys: number[], yHat: number[]): number {
  const mse = ys.reduce((s, y, i) => s + (y - yHat[i]) ** 2, 0) / ys.length;
  return Math.sqrt(mse);
}

/** Mean Absolute Error */
export function mae(ys: number[], yHat: number[]): number {
  return ys.reduce((s, y, i) => s + Math.abs(y - yHat[i]), 0) / ys.length;
}

/** Generate a smooth curve for plotting */
export function curvePoints(
  coeffs: number[],
  xMin: number,
  xMax: number,
  n = 300
): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const x = xMin + (i / (n - 1)) * (xMax - xMin);
    return { x, y: polyEval(coeffs, x) };
  });
}

// ============================================================
// Dataset generators  (mirror Python noise-generating logic)
// ============================================================
export type DatasetType = "linear" | "quadratic" | "cubic" | "sinusoidal" | "exponential" | "random";

export function generateDataset(
  type: DatasetType,
  nPoints: number,
  noiseLevel: number,
  seed = 42
): { x: number[]; y: number[] } {
  // Simple seeded PRNG (Mulberry32)
  let s = seed;
  const rand = () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const randn = () => {
    // Box-Muller
    const u = rand() || 1e-10;
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const x = Array.from({ length: nPoints }, (_, i) => -5 + (10 * i) / (nPoints - 1));
  let y: number[];

  switch (type) {
    case "linear":
      y = x.map((xi) => 2 * xi + 3 + noiseLevel * randn());
      break;
    case "quadratic":
      y = x.map((xi) => 0.5 * xi ** 2 - 2 * xi + 2.5 + noiseLevel * randn());
      break;
    case "cubic":
      y = x.map((xi) => 0.1 * xi ** 3 - 0.5 * xi ** 2 + xi + noiseLevel * randn());
      break;
    case "sinusoidal":
      y = x.map((xi) => 5 * Math.sin(xi) + noiseLevel * randn());
      break;
    case "exponential":
      y = x.map((xi) => Math.exp(0.4 * xi) + noiseLevel * randn());
      break;
    case "random":
    default:
      y = x.map(() => 10 * rand() - 5 + noiseLevel * randn());
      break;
  }
  return { x, y };
}

/** Format polynomial equation string */
export function formatEquation(coeffs: number[]): string {
  const deg = coeffs.length - 1;
  const terms = coeffs.map((c, i) => {
    const power = deg - i;
    const sign = c >= 0 ? "+" : "−";
    const abs = Math.abs(c).toFixed(4);
    if (power === 0) return `${sign} ${abs}`;
    if (power === 1) return `${sign} ${abs}x`;
    return `${sign} ${abs}x^${power}`;
  });
  let eq = "y = " + terms.join(" ").replace(/^\+ /, "").replace(/^− /, "−");
  return eq;
}

/** Generate animation frames: degree-1 fit → target degree fit,
 *  interpolating coefficients so the curve morphs from worst→best */
export function generateAnimationFrames(
  xs: number[],
  ys: number[],
  targetDegree: number,
  totalFrames = 60
): number[][] {
  // Worst fit: degree 1 (linear)  →  best fit: targetDegree
  const worstCoeffs = polyFit(xs, ys, 1);
  const bestCoeffs  = polyFit(xs, ys, targetDegree);

  // Pad worst coefficients to match best length (prepend zeros)
  const padded = [
    ...new Array(bestCoeffs.length - worstCoeffs.length).fill(0),
    ...worstCoeffs,
  ];

  return Array.from({ length: totalFrames }, (_, frame) => {
    const t = frame / (totalFrames - 1); // 0 → 1
    // Ease-in-out cubic
    const ease = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
    return bestCoeffs.map((b, i) => padded[i] + ease * (b - padded[i]));
  });
}
