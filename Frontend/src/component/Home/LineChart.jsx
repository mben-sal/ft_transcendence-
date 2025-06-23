import { useState, useEffect } from 'react';
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function LineChart() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Static fallback data
    setChartData([
      { day: 25, matches: 4 },
      { day: 26, matches: 5 },
      { day: 27, matches: 7 },
      { day: 28, matches: 8 },
      { day: 29, matches: 7 },
      { day: 30, matches: 6 }
    ]);
  }, []);

  const data = {
    labels: chartData.map(item => `Day ${item.day}`),
    datasets: [
      {
        data: chartData.map(item => item.matches),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1F2937',
        bodyColor: '#1F2937',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        padding: 12,
        borderColor: '#E5E7EB',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          title: (tooltipItems) => {
            const day = tooltipItems[0].label.split(' ')[1];
            const date = new Date(2024, 11, parseInt(day)); // December 2024
            return date.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
          },
          label: (context) => `${context.parsed.y} matches`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        ticks: {
          font: { size: 12 },
          color: '#6B7280'
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 12 },
          color: '#6B7280',
          callback: function (value) {
            const day = this.getLabelForValue(value).split(' ')[1];
            const date = new Date(2024, 11, parseInt(day));
            return date.toLocaleDateString('fr-FR', { day: 'numeric' });
          }
        }
      }
    }
  };

  return (
    <div className="h-full w-full">
      <Line data={data} options={options} />
    </div>
  );
}

export default LineChart;
