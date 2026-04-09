import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { polyFit, polyEval, rSquared } from "../utils/polyMath";

interface Props {
  xs: number[];
  ys: number[];
  currentDegree: number;
}

export default function DegreeCompare({ xs, ys, currentDegree }: Props) {
  const data = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const deg = i + 1;
      try {
        const coeffs = polyFit(xs, ys, deg);
        const yHat   = xs.map(x => polyEval(coeffs, x));
        const r2     = Math.max(0, Math.min(1, rSquared(ys, yHat)));
        return { degree: `d${deg}`, r2, deg };
      } catch {
        return { degree: `d${deg}`, r2: 0, deg };
      }
    });
  }, [xs, ys]);

  return (
    <div className="bg-[#141824] border border-[#1e2538] rounded-xl p-4">
      <h3 className="text-[11px] font-bold tracking-widest text-gray-300 uppercase mb-3">
        R² by Degree
      </h3>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2538" vertical={false} />
          <XAxis dataKey="degree" tick={{ fill: "#6b7280", fontSize: 9 }} stroke="#374151" />
          <YAxis domain={[0, 1]} tick={{ fill: "#6b7280", fontSize: 9 }} stroke="#374151" />
          <Tooltip
            contentStyle={{ background: "#0d1117", border: "1px solid #1e2538", borderRadius: 8, fontSize: 10 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any) => [typeof v === "number" ? v.toFixed(4) : String(v), "R²"]}
          />
          <Bar dataKey="r2" radius={[3, 3, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.deg}
                fill={entry.deg === currentDegree ? "#7c3aed" : "#1e2538"}
                stroke={entry.deg === currentDegree ? "#a78bfa" : "transparent"}
                strokeWidth={1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
