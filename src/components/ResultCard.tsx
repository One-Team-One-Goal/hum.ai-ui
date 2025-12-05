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

  // Handle error response from backend
  if (result.error) {
    return (
      <Card className="w-full overflow-hidden border-border shadow-sm mt-8">
        <CardContent className="p-6">
          <div className="text-center text-rose-600">
            <p className="font-semibold">Analysis Error</p>
            <p className="text-sm mt-2">{result.error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const gradeColorMap: Record<string, string> = {
    PREMIUM: "text-emerald-600",
    "GRADE 1": "text-blue-600",
    "GRADE 2": "text-amber-600",
    "GRADE 3": "text-orange-600",
    "FAIL / BELOW GRADE 3": "text-rose-600",
  };
  const gradeColor = gradeColorMap[result.grade] || "text-foreground";

  const gradeBgMap: Record<string, string> = {
    PREMIUM: "bg-emerald-50 border-emerald-200",
    "GRADE 1": "bg-blue-50 border-blue-200",
    "GRADE 2": "bg-amber-50 border-amber-200",
    "GRADE 3": "bg-orange-50 border-orange-200",
    "FAIL / BELOW GRADE 3": "bg-rose-50 border-rose-200",
  };
  const gradeBg = gradeBgMap[result.grade] || "bg-muted border-border";

  // Color mapping for each grain category
  const labelColors: Record<string, string> = {
    whole: "#10b981",      // Emerald green - good quality
    clean: "#22c55e",      // Green - good quality
    broken: "#f59e0b",     // Amber - moderate issue
    chalky: "#8b5cf6",     // Purple - quality issue
    immature: "#06b6d4",   // Cyan - developmental issue
    discolored: "#ef4444", // Red - damaged
    foreignObject: "#64748b", // Slate gray - foreign matter
  };

  // Prepare chart data for recharts - using backend response format
  // Backend returns: headRicePercent, brokenPercent, chalkyPercent, immaturePercent, discoloredPercent
  const chartData = [
    {
      name: "Whole",
      value: parseFloat(result.headRicePercent || "0"),
      fill: labelColors.whole,
    },
    {
      name: "Broken",
      value: parseFloat(result.brokenPercent || "0"),
      fill: labelColors.broken,
    },
    {
      name: "Chalky",
      value: parseFloat(result.chalkyPercent || "0"),
      fill: labelColors.chalky,
    },
    {
      name: "Immature",
      value: parseFloat(result.immaturePercent || "0"),
      fill: labelColors.immature,
    },
    {
      name: "Discolored",
      value: parseFloat(result.discoloredPercent || "0"),
      fill: labelColors.discolored,
    },
  ];

  // Calculate foreign object percentage if we have total grains
  const foreignPct =
    result.totalGrains && result.foreignObjects
      ? ((result.foreignObjects / result.totalGrains) * 100).toFixed(1)
      : null;

  // Additional stats for display including counts
  const additionalStats = [
    { label: "Total Grains", value: result.totalGrains },
    { label: "Foreign Objects", value: result.foreignObjects, color: labelColors.foreignObject },
    ...(result.counts?.clean ? [{ label: "Clean Grains", value: result.counts.clean, color: labelColors.clean }] : []),
    ...(foreignPct ? [{ label: "Foreign %", value: `${foreignPct}%`, color: labelColors.foreignObject }] : []),
  ].filter((stat) => stat.value !== undefined && stat.value !== null);

  return (
    <Card className="w-full overflow-hidden border-border shadow-sm mt-8">
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-1">
              PNS/BAFS 290:2019
            </p>
            <h2
              className={`text-xl sm:text-2xl font-bold tracking-tight ${gradeColor}`}
            >
              {result.grade}
            </h2>
          </div>
          <div
            className={`px-2 sm:px-3 py-1 rounded-xl border shrink-0 ${gradeBg}`}
          >
            <p className="text-[8px] sm:text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
              {new Date(result.timestamp).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0 px-3 sm:px-6">
        {/* Metrics Display with Chart */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left: Metric Values */}
          <div className="shrink-0 w-full md:w-40 space-y-3 pt-2 sm:pt-4 items-center my-auto">
            <div className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-2 sm:gap-y-3">
              {chartData.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                    {metric.name}:
                  </span>
                  <span
                    className="text-xs sm:text-sm font-semibold"
                    style={{ color: metric.fill }}
                  >
                    {metric.value.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Divider */}
            {additionalStats.length > 0 && (
              <div className="border-t border-border/40 my-2 pt-2 space-y-1 sm:space-y-2 grid grid-cols-2 md:grid-cols-1 gap-x-4 md:gap-x-0">
                {additionalStats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-0.5"
                  >
                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                      {stat.label}:
                    </span>
                    <span 
                      className="text-xs sm:text-sm font-semibold"
                      style={{ color: stat.color || "inherit" }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Radar Chart */}
          <div className="flex-1 h-[200px] sm:h-[250px] md:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid stroke="#e5e7eb" strokeWidth={1.5} />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: "#6b7280", fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value: number) => `${value}%`}
                />
                <Radar
                  name={result.modelVersion || "Rice Analysis Model"}
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
        <div className="mt-4 p-2 sm:p-3 bg-muted/30 rounded-lg border border-border/40">
          <p className="text-[8px] sm:text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Analysis Summary
          </p>
          <p className="text-[10px] sm:text-xs text-foreground/80 leading-relaxed">
            {result.notes ||
              `Analyzed ${result.totalGrains || "N/A"} grains. ${
                result.foreignObjects
                  ? `Detected ${result.foreignObjects} foreign object(s).`
                  : ""
              } Classification based on PNS/BAFS 290:2019 milling standards.`}
          </p>
        </div>

        {/* AI Model Info */}
        {result.modelVersion && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[8px] sm:text-[9px] text-muted-foreground/60 pt-1 gap-0.5">
            <span>Model: {result.modelVersion}</span>
            <span>Confidence: {result.confidence || "N/A"}%</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-muted/20 border-t border-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 sm:py-3 px-3 sm:px-6 gap-2">
        <span className="text-[8px] sm:text-[9px] text-muted-foreground/60 font-mono tracking-wider">
          REPORT ID:{" "}
          {result.timestamp
            ? new Date(result.timestamp).getTime().toString().slice(-8)
            : "00000000"}
        </span>
        <button
          onClick={exportJSON}
          className="text-[8px] sm:text-[9px] font-semibold text-foreground/70 hover:text-foreground transition-colors uppercase tracking-widest px-2 sm:px-3 py-1 sm:py-1.5 rounded hover:bg-background/50"
        >
          Export JSON
        </button>
      </CardFooter>
    </Card>
  );
};

export default ResultCard;
