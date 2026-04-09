import React from "react";
import { DatasetType } from "../utils/polyMath";
import { Activity, BarChart2, Zap, Waves, TrendingUp, Shuffle, SlidersHorizontal } from "lucide-react";

interface SidebarProps {
  degree: number;
  setDegree: (d: number) => void;
  nPoints: number;
  setNPoints: (n: number) => void;
  noiseLevel: number;
  setNoiseLevel: (n: number) => void;
  datasetType: DatasetType;
  setDatasetType: (t: DatasetType) => void;
  showResiduals: boolean;
  setShowResiduals: (b: boolean) => void;
  onRegenerate: () => void;
}

const DATASET_TYPES: { key: DatasetType; label: string; icon: React.ReactNode }[] = [
  { key: "linear",      label: "Linear",      icon: <TrendingUp size={13} /> },
  { key: "quadratic",   label: "Quadratic",   icon: <BarChart2 size={13} /> },
  { key: "cubic",       label: "Cubic",       icon: <Activity size={13} /> },
  { key: "sinusoidal",  label: "Sinusoidal",  icon: <Waves size={13} /> },
  { key: "exponential", label: "Exponential", icon: <Zap size={13} /> },
  { key: "random",      label: "Random",      icon: <Shuffle size={13} /> },
];

export default function Sidebar({
  degree, setDegree,
  nPoints, setNPoints,
  noiseLevel, setNoiseLevel,
  datasetType, setDatasetType,
  showResiduals, setShowResiduals,
  onRegenerate,
}: SidebarProps) {
  return (
    <aside className="w-[270px] min-w-[220px] flex flex-col gap-4 h-full overflow-y-auto pr-1 scrollbar-hide">
      {/* Polynomial Degree */}
      <section className="bg-[#141824] border border-[#1e2538] rounded-xl p-4">
        <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2">
          <SlidersHorizontal size={12} className="text-violet-400" />
          Polynomial Degree
        </h3>
        <div className="flex items-center gap-3 mb-2">
          <input
            type="range" min={1} max={10} step={1} value={degree}
            onChange={e => setDegree(+e.target.value)}
            className="flex-1 accent-violet-500 h-1 cursor-pointer"
          />
          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-600 text-white font-bold text-sm">
            {degree}
          </span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>1 (Linear)</span>
          <span>5 (Quintic)</span>
          <span>10</span>
        </div>
      </section>

      {/* Generate Dataset */}
      <section className="bg-[#141824] border border-[#1e2538] rounded-xl p-4">
        <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4">Generate Dataset</h3>

        {/* Points slider */}
        <div className="mb-3">
          <div className="flex justify-between text-[11px] text-gray-400 mb-1">
            <span>Points</span>
            <span className="text-violet-400 font-semibold">{nPoints}</span>
          </div>
          <input
            type="range" min={10} max={100} step={5} value={nPoints}
            onChange={e => setNPoints(+e.target.value)}
            className="w-full accent-violet-500 h-1 cursor-pointer"
          />
        </div>

        {/* Noise slider */}
        <div className="mb-4">
          <div className="flex justify-between text-[11px] text-gray-400 mb-1">
            <span>Noise Level</span>
            <span className="text-violet-400 font-semibold">{noiseLevel.toFixed(1)}</span>
          </div>
          <input
            type="range" min={0} max={10} step={0.5} value={noiseLevel}
            onChange={e => setNoiseLevel(+e.target.value)}
            className="w-full accent-violet-500 h-1 cursor-pointer"
          />
        </div>

        {/* Dataset type buttons */}
        <div className="grid grid-cols-2 gap-2">
          {DATASET_TYPES.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setDatasetType(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium border transition-all duration-200
                ${datasetType === key
                  ? "bg-violet-600/20 border-violet-500 text-violet-300"
                  : "bg-[#0d1117] border-[#1e2538] text-gray-400 hover:border-violet-600/50 hover:text-gray-200"
                }`}
            >
              <span className={datasetType === key ? "text-violet-400" : "text-gray-500"}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={onRegenerate}
          className="mt-3 w-full py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"
        >
          ↺ Regenerate Data
        </button>
      </section>

      {/* Display Options */}
      <section className="bg-[#141824] border border-[#1e2538] rounded-xl p-4">
        <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4">Display Options</h3>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-gray-300">Show Residuals Plot</span>
          <button
            onClick={() => setShowResiduals(!showResiduals)}
            className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${showResiduals ? "bg-violet-600" : "bg-gray-700"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${showResiduals ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      </section>

      {/* Python info badge */}
      <section className="bg-[#0d1117] border border-[#1e2538] rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Python Stack</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["NumPy", "SciPy", "Matplotlib", "Streamlit", "Pandas", "Scikit-learn"].map(lib => (
            <span key={lib} className="px-2 py-0.5 rounded bg-[#1a2035] text-[10px] text-cyan-400 border border-cyan-900/50">
              {lib}
            </span>
          ))}
        </div>
      </section>
    </aside>
  );
}
