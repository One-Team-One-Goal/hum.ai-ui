import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "./Card";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  result: any | null;
}

const ResultCard: React.FC<Props> = ({ result }) => {
  function exportJSON() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rice-grade-${result.timestamp || "report"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!result) {
    return null;
  }

  const gradeColor =
    {
      Premium: "text-emerald-600",
      "Grade 1": "text-blue-600",
      "Grade 2": "text-amber-600",
      Substandard: "text-rose-600",
    }[result.grade] || "text-foreground";

  const gradeBg =
    {
      Premium: "bg-emerald-50 border-emerald-200",
      "Grade 1": "bg-blue-50 border-blue-200",
      "Grade 2": "bg-amber-50 border-amber-200",
      Substandard: "bg-rose-50 border-rose-200",
    }[result.grade] || "bg-muted border-border";

  // Prepare chart data for recharts - always show all 6 metrics
  const chartData = [
    {
      name: "Head Rice",
      value: parseFloat(result.headRicePercent || "0"),
      fill: "#10b981",
    },
    {
      name: "Broken",
      value: parseFloat(result.brokenPercent || "0"),
      fill: "#f59e0b",
    },
    {
      name: "Chalkiness",
      value: parseFloat(result.chalkinessPercent || "0"),
      fill: "#f43f5e",
    },
    {
      name: "Damaged",
      value: parseFloat(result.damagedPercent || "0"),
      fill: "#64748b",
    },
    {
      name: "Discolored",
      value: parseFloat(result.discoloredPercent || "0"),
      fill: "#a8a29e",
    },
    {
      name: "Moisture",
      value: parseFloat(result.moisture || "0"),
      fill: "#3b82f6",
    },
  ];

  return (
    <Card className="w-full overflow-hidden border-border shadow-sm mt-8">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-1">
              PNS/BAFS 290:2019 Classification
            </p>
            <h2 className={`text-2xl font-bold tracking-tight ${gradeColor}`}>
              {result.grade}
            </h2>
          </div>
          <div className={`px-3 py-1 rounded-xl border ${gradeBg}`}>
            <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
              {new Date(result.timestamp).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {/* Metrics Display with Chart */}
        <div className="mt-2 flex gap-4">
          {/* Left: Metric Values */}
          <div className="flex-shrink-0 w-40 space-y-3 pt-4 items-center my-auto">
            {chartData.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {metric.name}:
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: metric.fill }}
                >
                  {metric.value.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          {/* Right: Radar Chart */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={chartData}>
                <PolarGrid stroke="#e5e7eb" strokeWidth={1.5} />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value: number) => `${value}%`}
                />
                <Radar
                  name="PNS/BAFS 290:2019 Metrics"
                  dataKey="value"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toFixed(1)}%`,
                    "Value",
                  ]}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "12px",
                    padding: "8px 12px",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Standard Compliance */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/40">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Standard Compliance
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed">
            {result.notes ||
              "Classification based on PNS/BAFS 290:2019 milling standards. Analysis includes RGB + NIR imaging processed through CNN model."}
          </p>
        </div>

        {/* AI Model Info */}
        {result.modelVersion && (
          <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 pt-1">
            <span>Model: {result.modelVersion}</span>
            <span>Confidence: {result.confidence || "N/A"}%</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-muted/20 border-t border-border/40 flex justify-between items-center py-3">
        <span className="text-[9px] text-muted-foreground/60 font-mono tracking-wider">
          REPORT ID:{" "}
          {result.timestamp
            ? new Date(result.timestamp).getTime().toString().slice(-8)
            : "00000000"}
        </span>
        <button
          onClick={exportJSON}
          className="text-[9px] font-semibold text-foreground/70 hover:text-foreground transition-colors uppercase tracking-widest px-3 py-1.5 rounded hover:bg-background/50"
        >
          Export JSON
        </button>
      </CardFooter>
    </Card>
  );
};

export default ResultCard;
