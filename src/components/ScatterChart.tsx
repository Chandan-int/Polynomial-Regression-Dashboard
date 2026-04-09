import React, { useMemo } from "react";
import {
  Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, ComposedChart,
} from "recharts";
import { curvePoints } from "../utils/polyMath";

interface Props {
  xs: number[];
  ys: number[];
  coeffs: number[];
  r2: number;
  title?: string;
  curveColor?: string;
  badge?: React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GreenDot = (props: any) => (
  <circle cx={props.cx} cy={props.cy} r={4.5} fill="#34d399" stroke="#065f46" strokeWidth={1} opacity={0.9} />
);

export default function ScatterPlot({
  xs, ys, coeffs, r2,
  title = "Scatter Plot & Regression Curve",
  curveColor = "#a78bfa",
  badge,
}: Props) {
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);

  const scatterData = useMemo(() => xs.map((x, i) => ({ x, y: ys[i] })), [xs, ys]);
  const curveData   = useMemo(() => curvePoints(coeffs, xMin, xMax, 200),  [coeffs, xMin, xMax]);

  // Unified Y domain: include BOTH scatter points and curve values so they share the same axis
  const yDomain = useMemo((): [number, number] => {
    const allY = [...ys, ...curveData.map(p => p.y)];
    const lo = Math.min(...allY);
    const hi = Math.max(...allY);
    const pad = Math.max((hi - lo) * 0.12, 1);
    return [lo - pad, hi + pad];
  }, [ys, curveData]);

  return (
    <div className="bg-[#141824] border border-[#1e2538] rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[11px] font-bold tracking-widest text-gray-300 uppercase">{title}</h3>
        {badge ?? (
          <span className="px-3 py-1 rounded-lg bg-violet-600/20 border border-violet-500/40 text-violet-300 text-[11px] font-semibold">
            R² = {r2.toFixed(6)}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2538" />
          <XAxis
            dataKey="x"
            type="number"
            domain={[xMin - 0.5, xMax + 0.5]}
            stroke="#374151"
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickFormatter={(v: number) => v.toFixed(1)}
          />
          <YAxis
            domain={yDomain}
            stroke="#374151"
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickFormatter={(v: number) => v.toFixed(1)}
          />
          <Tooltip
            contentStyle={{ background: "#0d1117", border: "1px solid #1e2538", borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: "#a78bfa" }}
            itemStyle={{ color: "#e5e7eb" }}
          />
          <Scatter data={scatterData} fill="#34d399" shape={<GreenDot />} />
          <Line
            data={curveData}
            type="monotone"
            dataKey="y"
            stroke={curveColor}
            strokeWidth={2.5}
            dot={false}
            strokeDasharray="6 3"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
