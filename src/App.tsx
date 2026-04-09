import { useState, useMemo, useCallback, useRef } from "react";
import Sidebar        from "./components/Sidebar";
import ScatterPlot    from "./components/ScatterChart";
import AnimatedCurve  from "./components/AnimatedCurve";
import ResidualsChart from "./components/ResidualsChart";
import StatsPanel     from "./components/StatsPanel";
import DegreeCompare  from "./components/DegreeCompare";

import {
  generateDataset, polyFit, polyEval,
  rSquared, adjR2 as calcAdjR2, rmse as calcRmse, mae as calcMae,
  DatasetType,
} from "./utils/polyMath";

const SEED_BASE = 42;

export default function App() {
  // ── Controls ─────────────────────────────────────────────
  const [degree,       setDegree]       = useState(2);
  const [nPoints,      setNPoints]      = useState(30);
  const [noiseLevel,   setNoiseLevel]   = useState(3.0);
  const [datasetType,  setDatasetType]  = useState<DatasetType>("quadratic");
  const [showResiduals, setShowResiduals] = useState(true);
  const [activeTab,    setActiveTab]    = useState<"stats" | "data">("stats");
  const seedRef = useRef(SEED_BASE);

  // ── Dataset generation ───────────────────────────────────
  const [seed, setSeed] = useState(SEED_BASE);
  const { x: xs, y: ys } = useMemo(
    () => generateDataset(datasetType, nPoints, noiseLevel, seed),
    [datasetType, nPoints, noiseLevel, seed]
  );

  const handleRegenerate = useCallback(() => {
    seedRef.current += 1;
    setSeed(seedRef.current);
  }, []);

  // ── Polynomial fit ───────────────────────────────────────
  const coeffs = useMemo(() => polyFit(xs, ys, degree), [xs, ys, degree]);
  const yHat   = useMemo(() => xs.map(x => polyEval(coeffs, x)), [coeffs, xs]);
  const r2     = useMemo(() => rSquared(ys, yHat), [ys, yHat]);
  const ar2    = useMemo(() => calcAdjR2(r2, nPoints, degree), [r2, nPoints, degree]);
  const rmse   = useMemo(() => calcRmse(ys, yHat), [ys, yHat]);
  const mae    = useMemo(() => calcMae(ys, yHat),  [ys, yHat]);

  const qualityColor = r2 >= 0.95 ? "#34d399" : r2 >= 0.8 ? "#a3e635" : r2 >= 0.5 ? "#facc15" : "#f87171";

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* ── Top Nav ── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-[#1e2538] bg-[#0d1117] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 20 Q8 5 12 10 Q16 15 21 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-bold text-white tracking-tight">PolyFit</div>
            <div className="text-[10px] text-gray-500">Polynomial Regression Dashboard</div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141824] border border-[#1e2538] text-[11px] text-gray-400">
            <span className="text-cyan-400">λ</span>
            <span>{nPoints} pts</span>
            <span className="text-gray-600">·</span>
            <span>deg {degree}</span>
            <span className="text-gray-600">·</span>
            <span>R² <span style={{ color: qualityColor }}>{r2.toFixed(4)}</span></span>
          </div>

          {/* Streamlit badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff4b4b]/10 border border-[#ff4b4b]/30 text-[10px] text-[#ff4b4b] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff4b4b] animate-pulse" />
            Streamlit
          </div>

          {/* Python badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-900/20 border border-cyan-800/40 text-[10px] text-cyan-400 font-bold">
            🐍 Python
          </div>

          {/* Live dot */}
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex flex-1 gap-4 p-4 min-h-0">
        {/* Left sidebar */}
        <Sidebar
          degree={degree}         setDegree={setDegree}
          nPoints={nPoints}       setNPoints={setNPoints}
          noiseLevel={noiseLevel} setNoiseLevel={setNoiseLevel}
          datasetType={datasetType} setDatasetType={setDatasetType}
          showResiduals={showResiduals} setShowResiduals={setShowResiduals}
          onRegenerate={handleRegenerate}
        />

        {/* Centre content */}
        <main className="flex-1 flex flex-col gap-4 min-w-0">
          {/* ① Direct fit curve */}
          <ScatterPlot
            xs={xs} ys={ys} coeffs={coeffs} r2={r2}
            title="① Direct Polynomial Fit"
            curveColor="#a78bfa"
            badge={
              <span className="px-3 py-1 rounded-lg bg-violet-600/20 border border-violet-500/40 text-violet-300 text-[11px] font-semibold">
                R² = {r2.toFixed(6)}
              </span>
            }
          />

          {/* ② Animated curve: worst → best */}
          <AnimatedCurve
            key={`${xs.join(",")}-${degree}`}
            xs={xs} ys={ys}
            degree={degree}
            targetCoeffs={coeffs}
            targetR2={r2}
          />

          {/* Residuals (optional) */}
          {showResiduals && (
            <ResidualsChart xs={xs} ys={ys} coeffs={coeffs} />
          )}

          {/* R² by Degree comparison */}
          <DegreeCompare xs={xs} ys={ys} currentDegree={degree} />
        </main>

        {/* Right stats panel */}
        <StatsPanel
          coeffs={coeffs}
          r2={r2}
          adjR2={ar2}
          rmse={rmse}
          mae={mae}
          nPoints={nPoints}
          degree={degree}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          xs={xs}
          ys={ys}
        />
      </div>

      {/* ── Footer ── */}
      <footer className="px-5 py-2 border-t border-[#1e2538] flex items-center justify-between text-[10px] text-gray-600">
        <span>PolyFit — Polynomial Regression Dashboard</span>
        <div className="flex items-center gap-4">
          <span>NumPy · SciPy · Matplotlib · Streamlit · Pandas · Scikit-learn</span>
          <span className="text-violet-500">degree={degree} · n={nPoints} · noise={noiseLevel}</span>
        </div>
      </footer>
    </div>
  );
}
