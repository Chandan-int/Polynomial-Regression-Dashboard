import { CheckCircle, AlertCircle, Info } from "lucide-react";
import { formatEquation } from "../utils/polyMath";

interface Props {
  coeffs: number[];
  r2: number;
  adjR2: number;
  rmse: number;
  mae: number;
  nPoints: number;
  degree: number;
  activeTab: "stats" | "data";
  setActiveTab: (t: "stats" | "data") => void;
  xs: number[];
  ys: number[];
}

function FitBadge({ r2 }: { r2: number }) {
  if (r2 >= 0.95) return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-900/20 border border-emerald-700/40">
      <CheckCircle size={16} className="text-emerald-400" />
      <div>
        <div className="text-[12px] font-bold text-emerald-400">Excellent Fit</div>
        <div className="text-[10px] text-gray-500">R² = {r2.toFixed(6)}</div>
      </div>
    </div>
  );
  if (r2 >= 0.8) return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-lime-900/20 border border-lime-700/40">
      <CheckCircle size={16} className="text-lime-400" />
      <div>
        <div className="text-[12px] font-bold text-lime-400">Good Fit</div>
        <div className="text-[10px] text-gray-500">R² = {r2.toFixed(6)}</div>
      </div>
    </div>
  );
  if (r2 >= 0.5) return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-900/20 border border-yellow-700/40">
      <AlertCircle size={16} className="text-yellow-400" />
      <div>
        <div className="text-[12px] font-bold text-yellow-400">Fair Fit</div>
        <div className="text-[10px] text-gray-500">R² = {r2.toFixed(6)}</div>
      </div>
    </div>
  );
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/20 border border-red-700/40">
      <Info size={16} className="text-red-400" />
      <div>
        <div className="text-[12px] font-bold text-red-400">Poor Fit</div>
        <div className="text-[10px] text-gray-500">R² = {r2.toFixed(6)}</div>
      </div>
    </div>
  );
}

export default function StatsPanel({ coeffs, r2, adjR2, rmse, mae, nPoints, degree, activeTab, setActiveTab, xs, ys }: Props) {
  const equation = formatEquation(coeffs);
  const degreeNames = ["", "Linear", "Quadratic", "Cubic", "Quartic", "Quintic", "Sextic", "Septic", "Octic", "Nonic", "Decic"];

  return (
    <aside className="w-[240px] min-w-[200px] flex flex-col gap-3 h-full overflow-y-auto scrollbar-hide">
      {/* Tabs */}
      <div className="flex bg-[#0d1117] border border-[#1e2538] rounded-xl overflow-hidden">
        {(["stats", "data"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all
              ${activeTab === tab ? "bg-violet-600/30 text-violet-300 border-b-2 border-violet-500" : "text-gray-500 hover:text-gray-300"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "stats" && (
        <>
          {/* Fitted Equation */}
          <div className="bg-[#141824] border border-[#1e2538] rounded-xl p-3">
            <h4 className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">Fitted Equation</h4>
            <div className="bg-[#0d1117] rounded-lg p-2 text-[11px] font-mono text-violet-300 break-all leading-5">
              {equation}
            </div>
          </div>

          {/* Fit quality badge */}
          <FitBadge r2={r2} />

          {/* R² / Adj R² */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#141824] border border-[#1e2538] rounded-xl p-3">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">R²</div>
              <div className="text-[18px] font-bold text-violet-400">{r2.toFixed(6)}</div>
              <div className="text-[9px] text-gray-600 mt-1">Coeff. of Determination</div>
            </div>
            <div className="bg-[#141824] border border-[#1e2538] rounded-xl p-3">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">ADJ. R²</div>
              <div className="text-[18px] font-bold text-violet-400">{Math.max(0, adjR2).toFixed(6)}</div>
              <div className="text-[9px] text-gray-600 mt-1">Adjusted for predictors</div>
            </div>
          </div>

          {/* RMSE / MAE */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#141824] border border-[#1e2538] rounded-xl p-3">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">RMSE</div>
              <div className="text-[18px] font-bold text-orange-400">{rmse.toFixed(4)}</div>
              <div className="text-[9px] text-gray-600 mt-1">Root Mean Square Error</div>
            </div>
            <div className="bg-[#141824] border border-[#1e2538] rounded-xl p-3">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">MAE</div>
              <div className="text-[18px] font-bold text-orange-400">{mae.toFixed(4)}</div>
              <div className="text-[9px] text-gray-600 mt-1">Mean Absolute Error</div>
            </div>
          </div>

          {/* Coefficients */}
          <div className="bg-[#141824] border border-[#1e2538] rounded-xl p-3">
            <h4 className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">Coefficients</h4>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {coeffs.map((c, i) => {
                const power = coeffs.length - 1 - i;
                const label = power === 0 ? "β₀ (intercept)" : power === 1 ? "β₁ (x)" : `β${power} (x^${power})`;
                return (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-[#1e2538] last:border-0">
                    <span className="text-[10px] text-gray-400 font-mono">{label}</span>
                    <span className="text-[10px] text-white font-mono">{c >= 0 ? " " : ""}{c.toFixed(6)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model Info */}
          <div className="bg-[#141824] border border-[#1e2538] rounded-xl p-3">
            <h4 className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">Model Info</h4>
            <div className="grid grid-cols-2 gap-y-1 text-[10px]">
              <span className="text-gray-500">Degree</span>
              <span className="text-white text-right">{degree}</span>
              <span className="text-gray-500">Type</span>
              <span className="text-white text-right">{degreeNames[degree] ?? "Poly"}</span>
              <span className="text-gray-500">Samples</span>
              <span className="text-white text-right">{nPoints}</span>
              <span className="text-gray-500">Parameters</span>
              <span className="text-white text-right">{degree + 1}</span>
              <span className="text-gray-500">DOF</span>
              <span className="text-white text-right">{nPoints - degree - 1}</span>
            </div>
          </div>

          {/* Python code snippet */}
          <div className="bg-[#0d1117] border border-[#1e2538] rounded-xl p-3">
            <h4 className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">Python Code</h4>
            <pre className="text-[9px] text-cyan-400 font-mono whitespace-pre-wrap leading-4 overflow-x-auto">
{`import numpy as np

coeffs = np.polyfit(x, y, ${degree})
p = np.poly1d(coeffs)
y_hat = p(x)

r2 = 1 - np.var(y - y_hat) \\
       / np.var(y)
print(f"R² = {'{r2:.4f}'}")`}
            </pre>
          </div>
        </>
      )}

      {activeTab === "data" && (
        <div className="bg-[#141824] border border-[#1e2538] rounded-xl p-3">
          <h4 className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">
            Dataset ({xs.length} points)
          </h4>
          <div className="max-h-[550px] overflow-y-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-[#1e2538]">
                  <th className="text-left text-gray-500 py-1 pr-2">#</th>
                  <th className="text-right text-gray-500 py-1 pr-2">x</th>
                  <th className="text-right text-gray-500 py-1">y</th>
                </tr>
              </thead>
              <tbody>
                {xs.map((x, i) => (
                  <tr key={i} className="border-b border-[#1e2538]/50 hover:bg-[#1e2538]/30">
                    <td className="text-gray-600 py-0.5 pr-2">{i + 1}</td>
                    <td className="text-cyan-400 text-right font-mono py-0.5 pr-2">{x.toFixed(3)}</td>
                    <td className="text-emerald-400 text-right font-mono py-0.5">{ys[i].toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </aside>
  );
}
