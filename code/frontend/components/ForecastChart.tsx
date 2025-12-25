import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Forecast } from "../lib/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Props {
  forecast: Forecast;
}

export function ForecastChart({ forecast }: Props) {
  const labels = forecast.risk_mean.map((_, idx) => `+${idx + 1}h`);
  const data = {
    labels,
    datasets: [
      {
        label: "Risk mean",
        data: forecast.risk_mean,
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        tension: 0.3,
      },
      {
        label: "Risk std",
        data: forecast.risk_std,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.2)",
        borderDash: [4, 4],
      },
    ],
  };
  const options = {
    plugins: {
      legend: { labels: { color: "#e5e7eb" } },
    },
    scales: {
      x: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" } },
      y: { ticks: { color: "#9ca3af" }, grid: { color: "#1f2937" }, suggestedMin: 0, suggestedMax: 1 },
    },
  };
  return <Line data={data} options={options} />;
}



