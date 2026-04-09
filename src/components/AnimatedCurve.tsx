import { useEffect, useRef, useState, useCallback } from "react";
import { rSquared, rmse as calcRmse, polyEval, curvePoints } from "../utils/polyMath";

interface Props {
  xs: number[];
  ys: number[];
  degree: number;
  targetCoeffs: number[];
  targetR2: number;
}

// ─── Gradient Descent helpers ────────────────────────────────────────────────

/** Build Vandermonde design matrix (high-degree first) */
function buildVandermonde(xs: number[], deg: number): number[][] {
  return xs.map(x => Array.from({ length: deg + 1 }, (_, i) => Math.pow(x, deg - i)));
}

/** One GD step; returns new coefficients and MSE loss */
function gdStep(coeffs: number[], xs: number[], ys: number[], V: number[][], lr: number): [number[], number] {
  const n = xs.length;
  const grads = new Array(coeffs.length).fill(0);
  let loss = 0;
  for (let i = 0; i < n; i++) {
    const yHat = coeffs.reduce((s, c, j) => s + c * V[i][j], 0);
    const err  = yHat - ys[i];
    loss += err * err;
    for (let j = 0; j < coeffs.length; j++) grads[j] += (2 / n) * err * V[i][j];
  }
  const next = coeffs.map((c, j) => c - lr * grads[j]);
  return [next, loss / n];
}

/** Auto-tune learning rate: try several, pick the one that reduces loss fastest */
function tuneLR(xs: number[], ys: number[], deg: number, V: number[][]): number {
  const yRange = Math.max(...ys) - Math.min(...ys);
  const scale  = yRange || 1;
  const init   = new Array(deg + 1).fill(0);
  for (const lr of [1e-4, 1e-3, 1e-2, 5e-2, 0.1, 0.2]) {
    const [next, loss0] = gdStep(init, xs, ys, V, lr);
    const [, loss1]     = gdStep(next, xs, ys, V, lr);
    if (isFinite(loss1) && loss1 < loss0 && loss1 < scale * scale * 100) return lr;
  }
  return 1e-4;
}

// ─── Pre-compute ALL gradient descent steps once ──────────────────────────────

interface GDFrame {
  coeffs: number[];
  loss: number;
  r2: number;
  rmse: number;
}

function buildGDFrames(xs: number[], ys: number[], degree: number, totalFrames = 160): GDFrame[] {
  const V      = buildVandermonde(xs, degree);
  const lr     = tuneLR(xs, ys, degree, V);
  const frames: GDFrame[] = [];

  let coeffs = new Array(degree + 1).fill(0).map(() => (Math.random() - 0.5) * 0.05);

  // Run many more GD steps than we need, then sub-sample for 'totalFrames' smooth frames
  const STEPS = totalFrames * 12;
  const raw: { coeffs: number[]; loss: number }[] = [];

  for (let s = 0; s < STEPS; s++) {
    const [next, loss] = gdStep(coeffs, xs, ys, V, lr);
    coeffs = next;
    if (s % 12 === 0) raw.push({ coeffs: [...coeffs], loss });
  }

  // Keep exactly totalFrames evenly-spaced snapshots
  for (let i = 0; i < totalFrames; i++) {
    const src   = raw[Math.min(Math.round(i * (raw.length - 1) / (totalFrames - 1)), raw.length - 1)];
    const yHat  = xs.map(x => polyEval(src.coeffs, x));
    const r2    = rSquared(ys, yHat);
    const rmse  = calcRmse(ys, yHat);
    frames.push({ coeffs: src.coeffs, loss: src.loss, r2, rmse });
  }
  return frames;
}

// ─── Canvas drawing ───────────────────────────────────────────────────────────

const TRAIL_LEN = 6;

export default function AnimatedCurve({ xs, ys, degree, targetCoeffs, targetR2 }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const lossCanvasRef = useRef<HTMLCanvasElement>(null);
  const animRef      = useRef<number>(0);
  const frameRef     = useRef<number>(0);
  const framesRef    = useRef<GDFrame[]>([]);

  const [playing,    setPlaying]    = useState(false);
  const [frameIdx,   setFrameIdx]   = useState(0);
  const [speed,      setSpeed]      = useState(1);
  const [finished,   setFinished]   = useState(false);
  const [liveR2,     setLiveR2]     = useState(0);
  const [liveRmse,   setLiveRmse]   = useState(0);
  const [liveLoss,   setLiveLoss]   = useState(0);
  const [animMode,   setAnimMode]   = useState<"gd" | "interp">("gd");

  // Build (or rebuild) frames whenever data/degree/mode changes
  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    framesRef.current = buildGDFrames(xs, ys, degree, 160);
    frameRef.current  = 0;
    setFrameIdx(0);
    setFinished(false);
    setPlaying(false);
    drawFrame(0);
    drawLoss(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xs, ys, degree, animMode]);

  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);

  // ── Main canvas drawing ───────────────────────────────────────────────────
  const drawFrame = useCallback((fi: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || framesRef.current.length === 0) return;

    const W = canvas.width, H = canvas.height;
    const PAD = { top: 24, right: 20, bottom: 32, left: 44 };
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top  - PAD.bottom;

    // Y domain: union of data + all curve values in current frame
    const frame  = framesRef.current[fi] ?? framesRef.current[framesRef.current.length - 1];
    const curveY = curvePoints(frame.coeffs, xMin, xMax, 200).map(p => p.y);
    const allY   = [...ys, ...curveY];
    const yMin   = Math.min(...allY);
    const yMax   = Math.max(...allY);
    const yRange = yMax - yMin || 1;
    const yPad   = yRange * 0.12;

    const toX = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin || 1)) * plotW;
    const toY = (y: number) => PAD.top  + (1 - (y - (yMin - yPad)) / (yRange + 2 * yPad)) * plotH;

    // Background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 5; i++) {
      const gx = PAD.left + (i / 5) * plotW;
      ctx.beginPath(); ctx.moveTo(gx, PAD.top); ctx.lineTo(gx, PAD.top + plotH); ctx.stroke();
      const gy = PAD.top + (i / 5) * plotH;
      ctx.beginPath(); ctx.moveTo(PAD.left, gy); ctx.lineTo(PAD.left + plotW, gy); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(PAD.left, PAD.top, plotW, plotH);

    // Tick labels
    ctx.fillStyle = "#6b7280";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const xVal = xMin + (i / 5) * (xMax - xMin);
      ctx.fillText(xVal.toFixed(1), toX(xVal), PAD.top + plotH + 14);
    }
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const yVal = (yMin - yPad) + (i / 4) * (yRange + 2 * yPad);
      ctx.fillText(yVal.toFixed(1), PAD.left - 5, toY(yVal) + 3);
    }

    // ── Trail curves (ghost of previous frames) ───────────────────────────
    for (let t = TRAIL_LEN; t >= 1; t--) {
      const tfi = fi - t * Math.max(1, Math.round(8 / TRAIL_LEN));
      if (tfi < 0) continue;
      const tf      = framesRef.current[tfi];
      const alpha   = (1 - t / (TRAIL_LEN + 1)) * 0.18;
      const pts     = curvePoints(tf.coeffs, xMin, xMax, 200);

      ctx.beginPath();
      ctx.strokeStyle = `rgba(239,68,68,${alpha})`;
      ctx.lineWidth   = 1.2;
      ctx.setLineDash([]);
      pts.forEach((pt, i) => {
        const cx = toX(pt.x), cy = toY(pt.y);
        i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
      });
      ctx.stroke();
    }

    // ── Residual lines (shrinking as fit improves) ────────────────────────
    const progress = fi / Math.max(framesRef.current.length - 1, 1);
    const residAlpha = Math.max(0.04, 0.22 * (1 - progress));
    xs.forEach((x, idx) => {
      const yHat = polyEval(frame.coeffs, x);
      ctx.beginPath();
      ctx.strokeStyle = `rgba(239,68,68,${residAlpha})`;
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 3]);
      ctx.moveTo(toX(x), toY(ys[idx]));
      ctx.lineTo(toX(x), toY(yHat));
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // ── Data points ───────────────────────────────────────────────────────
    xs.forEach((x, idx) => {
      const cx = toX(x), cy = toY(ys[idx]);
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle   = "#10b981";
      ctx.fill();
      ctx.strokeStyle = "#065f46";
      ctx.lineWidth   = 1.2;
      ctx.stroke();
    });

    // ── Current fitted curve ──────────────────────────────────────────────
    const r = Math.round(255 * (1 - progress));
    const g = Math.round(180 * progress);
    const curveColor = `rgb(${r},${g},60)`;

    const pts = curvePoints(frame.coeffs, xMin, xMax, 200);
    ctx.beginPath();
    ctx.strokeStyle = curveColor;
    ctx.lineWidth   = 2.8;
    ctx.setLineDash([]);
    pts.forEach((pt, i) => {
      const cx = toX(pt.x), cy = toY(pt.y);
      i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
    });
    ctx.stroke();

    // ── HUD: R², RMSE live values ─────────────────────────────────────────
    const r2Color  = frame.r2 >= 0.9 ? "#10b981" : frame.r2 >= 0.7 ? "#f59e0b" : "#ef4444";
    ctx.font      = "bold 11px monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = r2Color;
    ctx.fillText(`R² = ${frame.r2.toFixed(4)}`, PAD.left + 6, PAD.top + 16);
    ctx.fillStyle = "#6b7280";
    ctx.font      = "10px monospace";
    ctx.fillText(`RMSE = ${frame.rmse.toFixed(3)}`, PAD.left + 6, PAD.top + 30);

    // Progress bar at top
    const barY = PAD.top - 8;
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(PAD.left, barY, plotW, 3);
    ctx.fillStyle = curveColor;
    ctx.fillRect(PAD.left, barY, plotW * progress, 3);

    setLiveR2(frame.r2);
    setLiveRmse(frame.rmse);
    setLiveLoss(frame.loss);
  }, [xs, ys, xMin, xMax, targetCoeffs]);

  // ── Loss curve canvas ─────────────────────────────────────────────────────
  const drawLoss = useCallback((fi: number) => {
    const canvas = lossCanvasRef.current;
    if (!canvas || framesRef.current.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const PAD = { top: 12, right: 12, bottom: 24, left: 44 };
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top  - PAD.bottom;

    const losses = framesRef.current.map(f => f.loss);
    const lMax   = Math.max(...losses) || 1;
    const lMin   = Math.min(...losses);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 4; i++) {
      const gy = PAD.top + (i / 4) * plotH;
      ctx.beginPath(); ctx.moveTo(PAD.left, gy); ctx.lineTo(PAD.left + plotW, gy); ctx.stroke();
    }

    // Full loss curve (faint)
    ctx.beginPath();
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth   = 1.2;
    framesRef.current.forEach((f, i) => {
      const cx = PAD.left + (i / (framesRef.current.length - 1)) * plotW;
      const cy = PAD.top  + (1 - (f.loss - lMin) / (lMax - lMin || 1)) * plotH;
      i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
    });
    ctx.stroke();

    // Drawn-so-far (vivid)
    ctx.beginPath();
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth   = 2;
    framesRef.current.slice(0, fi + 1).forEach((f, i) => {
      const cx = PAD.left + (i / (framesRef.current.length - 1)) * plotW;
      const cy = PAD.top  + (1 - (f.loss - lMin) / (lMax - lMin || 1)) * plotH;
      i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
    });
    ctx.stroke();

    // Current dot
    if (fi > 0) {
      const cx = PAD.left + (fi / (framesRef.current.length - 1)) * plotW;
      const cy = PAD.top  + (1 - (framesRef.current[fi].loss - lMin) / (lMax - lMin || 1)) * plotH;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#6366f1";
      ctx.fill();
    }

    // Axis labels
    ctx.fillStyle = "#9ca3af";
    ctx.font      = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Steps →", PAD.left + plotW / 2, PAD.top + plotH + 18);
    ctx.textAlign = "right";
    ctx.fillText(lMax.toFixed(1), PAD.left - 4, PAD.top + 10);
    ctx.fillText(lMin.toFixed(1), PAD.left - 4, PAD.top + plotH);

    // Title
    ctx.textAlign = "left";
    ctx.fillStyle = "#6366f1";
    ctx.font = "bold 10px monospace";
    ctx.fillText("Loss (MSE)", PAD.left + 4, PAD.top + 11);
  }, []);

  // ── Animation loop ────────────────────────────────────────────────────────
  const startAnimation = useCallback(() => {
    const total = framesRef.current.length;
    let lastTime = 0;
    const msPerFrame = 1000 / (30 * speed); // target 30fps × speed multiplier

    const step = (now: number) => {
      if (now - lastTime < msPerFrame) {
        animRef.current = requestAnimationFrame(step);
        return;
      }
      lastTime = now;
      const fi = frameRef.current;
      if (fi >= total) {
        setPlaying(false);
        setFinished(true);
        drawFrame(total - 1);
        drawLoss(total - 1);
        return;
      }
      drawFrame(fi);
      drawLoss(fi);
      setFrameIdx(fi);
      frameRef.current = fi + 1;
      animRef.current  = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }, [drawFrame, drawLoss, speed]);

  const handlePlay = () => {
    if (frameRef.current >= framesRef.current.length) {
      frameRef.current = 0;
      setFinished(false);
    }
    setPlaying(true);
  };

  const handlePause = () => {
    cancelAnimationFrame(animRef.current);
    setPlaying(false);
  };

  const handleReset = () => {
    cancelAnimationFrame(animRef.current);
    frameRef.current = 0;
    setFrameIdx(0);
    setFinished(false);
    setPlaying(false);
    drawFrame(0);
    drawLoss(0);
  };

  useEffect(() => {
    if (playing) {
      cancelAnimationFrame(animRef.current);
      startAnimation();
    }
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed]);

  const progress = framesRef.current.length > 0
    ? Math.min(frameIdx / (framesRef.current.length - 1), 1)
    : 0;

  const qualityLabel = () => {
    if (liveR2 >= 0.95) return { text: "Excellent Fit", color: "#10b981" };
    if (liveR2 >= 0.80) return { text: "Good Fit",      color: "#84cc16" };
    if (liveR2 >= 0.60) return { text: "Fair Fit",      color: "#f59e0b" };
    return                     { text: "Poor Fit",       color: "#ef4444" };
  };
  const ql = qualityLabel();

  return (
    <div className="bg-[#141824] border border-[#1e2538] rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-[11px] font-bold tracking-widest text-gray-300 uppercase">
          ② Gradient Descent Learning Animation
        </h3>
        <div className="flex items-center gap-2">
          {/* Mode switcher */}
          <div className="flex gap-1 bg-[#0d1117] rounded-lg p-1 border border-[#1e2538]">
            {(["gd", "interp"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => { setAnimMode(mode); handleReset(); }}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors
                  ${animMode === mode ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-300"}`}
              >
                {mode === "gd" ? "Gradient Descent" : "Interpolation"}
              </button>
            ))}
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold"
            style={{ color: ql.color, background: ql.color + "22" }}>
            {ql.text}
          </span>
        </div>
      </div>

      {/* Two-column: main canvas + live metrics */}
      <div className="flex gap-3">
        {/* Main canvas */}
        <canvas
          ref={canvasRef}
          width={620}
          height={280}
          className="flex-1 rounded-lg border border-[#1e2538]"
          style={{ background: "#fff" }}
        />

        {/* Live metrics panel */}
        <div className="w-[130px] flex flex-col gap-2 justify-center">
          {[
            { label: "R²",   value: liveR2.toFixed(4),   color: ql.color },
            { label: "RMSE", value: liveRmse.toFixed(3),  color: "#a78bfa" },
            { label: "Loss", value: liveLoss.toFixed(3),   color: "#f59e0b" },
          ].map(m => (
            <div key={m.label} className="bg-[#0d1117] border border-[#1e2538] rounded-lg p-2 text-center">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest">{m.label}</div>
              <div className="text-[16px] font-bold font-mono mt-0.5" style={{ color: m.color }}>
                {m.value}
              </div>
            </div>
          ))}

          {/* Coefficients */}
          <div className="bg-[#0d1117] border border-[#1e2538] rounded-lg p-2">
            <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Coefficients β</div>
            {(framesRef.current[frameIdx]?.coeffs ?? []).map((c, i) => (
              <div key={i} className="flex justify-between text-[9px] font-mono">
                <span className="text-gray-500">β{i}</span>
                <span className="text-cyan-400">{c.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loss curve */}
      <canvas
        ref={lossCanvasRef}
        width={760}
        height={80}
        className="w-full rounded-lg border border-[#1e2538]"
        style={{ background: "#fff" }}
      />

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={playing ? handlePause : handlePlay}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
        >
          {playing ? <><span>⏸</span> Pause</> : finished ? <><span>↺</span> Replay</> : <><span>▶</span> Play</>}
        </button>

        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#1e2538] hover:bg-[#252f48] text-gray-300 transition-colors"
        >
          ⏮ Reset
        </button>

        {/* Step forward */}
        <button
          onClick={() => {
            if (playing) return;
            const next = Math.min(frameRef.current + 1, framesRef.current.length - 1);
            frameRef.current = next;
            setFrameIdx(next);
            drawFrame(next);
            drawLoss(next);
          }}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#1e2538] hover:bg-[#252f48] text-gray-300 transition-colors"
        >
          ▶| Step
        </button>

        {/* Speed */}
        <div className="flex items-center gap-2 ml-2">
          <span className="text-[10px] text-gray-500">Speed</span>
          {[0.5, 1, 2, 4].map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors
                ${speed === s ? "bg-cyan-600/30 border-cyan-500 text-cyan-300" : "bg-transparent border-[#1e2538] text-gray-500 hover:text-gray-300"}`}
            >
              {s}×
            </button>
          ))}
        </div>

        <div className="ml-auto text-right">
          <div className="text-[10px] text-gray-500">Target R²</div>
          <div className="text-[13px] font-bold text-emerald-400">{targetR2.toFixed(4)}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-[#1e2538] rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: `${progress * 100}%`,
            background: "linear-gradient(90deg, #ef4444, #eab308, #22c55e)",
            transition: "width 50ms linear",
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-between text-[10px] text-gray-600">
        <span>Step {Math.min(frameIdx + 1, framesRef.current.length)} / {framesRef.current.length}</span>
        <span>Gradient Descent — degree {degree}</span>
        <span>Final R² = {targetR2.toFixed(4)}</span>
      </div>
    </div>
  );
}
