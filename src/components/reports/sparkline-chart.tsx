type SparklineChartProps = {
  title: string;
  unit?: string;
  points: Array<{ date: string; value: number }>;
  minY?: number;
  maxY?: number;
  referenceMin?: number;
  referenceMax?: number;
};

export function SparklineChart({
  title,
  unit,
  points,
  minY,
  maxY,
  referenceMin,
  referenceMax,
}: SparklineChartProps) {
  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-medium text-zinc-700">{title}</p>
        <p className="mt-2 text-sm text-zinc-500">Δεν υπαρχουν μετρησεις στην περιοδο.</p>
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  let yMin = minY ?? Math.min(dataMin, referenceMin ?? dataMin);
  let yMax = maxY ?? Math.max(dataMax, referenceMax ?? dataMax);
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }

  const width = 320;
  const height = 120;
  const pad = 12;

  const coords = points.map((p, i) => {
    const x = pad + (i / Math.max(points.length - 1, 1)) * (width - pad * 2);
    const y = height - pad - ((p.value - yMin) / (yMax - yMin)) * (height - pad * 2);
    return { x, y, ...p };
  });

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");

  const refMinY =
    referenceMin != null
      ? height - pad - ((referenceMin - yMin) / (yMax - yMin)) * (height - pad * 2)
      : null;
  const refMaxY =
    referenceMax != null
      ? height - pad - ((referenceMax - yMin) / (yMax - yMin)) * (height - pad * 2)
      : null;

  const last = coords[coords.length - 1];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-zinc-800">{title}</p>
        <p className="text-sm text-zinc-600">
          Τελευταια: <span className="font-semibold text-zinc-900">{last.value}</span>
          {unit ? ` ${unit}` : ""}
        </p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-32 w-full">
        {refMinY != null ? (
          <line
            x1={pad}
            x2={width - pad}
            y1={refMinY}
            y2={refMinY}
            stroke="#a1a1aa"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ) : null}
        {refMaxY != null ? (
          <line
            x1={pad}
            x2={width - pad}
            y1={refMaxY}
            y2={refMaxY}
            stroke="#a1a1aa"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ) : null}
        <path d={line} fill="none" stroke="#18181b" strokeWidth={2} />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={3} fill="#18181b" />
        ))}
      </svg>
      <p className="mt-1 text-xs text-zinc-500">
        {points[0]?.date} → {points[points.length - 1]?.date}
      </p>
    </div>
  );
}
