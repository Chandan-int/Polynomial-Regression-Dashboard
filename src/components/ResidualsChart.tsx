import { useMemo } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { polyEval } from "../utils/polyMath";

interface Props {
  xs: number[];
  ys: number[];
  coeffs: number[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OrangeDot = (props: any) => (
  <circle cx={props.cx} cy={props.cy} r={4} fill="#fb923c" stroke="#7c2d12" strokeWidth={1} opacity={0.9} />
);

export default function ResidualsChart({ xs, ys, coeffs }: Props) {
  const residuals = useMemo(() =>
    xs.map((x, i) => ({ x, y: ys[i] - polyEval(coeffs, x) })),
    [xs, ys, coeffs]
  );

  return (
    <div className="bg-[#141824] border border-[#1e2538] rounded-xl p-4">
      <h3 className="text-[11px] font-bold tracking-widest text-gray-300 uppercase mb-3">Residuals</h3>
      <ResponsiveContainer width="100%" height={190}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2538" />
          <XAxis
            dataKey="x" type="number"
            stroke="#374151" tick={{ fill: "#6b7280", fontSize: 10 }}
            tickFormatter={(v: number) => v.toFixed(1)}
          />
          <YAxis
            dataKey="y" type="number"
            stroke="#374151" tick={{ fill: "#6b7280", fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{ background: "#0d1117", border: "1px solid #1e2538", borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: "#fb923c" }}
            itemStyle={{ color: "#e5e7eb" }}
          />
          <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 4" strokeWidth={1} />
          <Scatter data={residuals} fill="#fb923c" shape={<OrangeDot />} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
