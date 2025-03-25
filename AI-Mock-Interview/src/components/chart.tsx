"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Define interfaces (unchanged)
interface Answer {
  id: string;
  userId: string;
  question: string;
  userAnswer: string;
  createdAt: string;
  Intervieweefeedback: string;
  Intervieweerating: number;
  correctAnswer: string;
  mockInterviewId: string;
}

interface Rating {
  jobPosition: string;
  answers: Answer[];
}

interface ApiResponse {
  ratings: Rating[];
}

const RatingsChart = ({userId}) => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobPositions, setJobPositions] = useState<string[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [originalData, setOriginalData] = useState<ApiResponse | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await fetch(
          `/api/getAllRating?userId=${userId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch ratings");
        }

        const data: ApiResponse = await response.json();
        setOriginalData(data);

        // Extract unique job positions
        const uniquePositions = [...new Set(data.ratings.map(rating => rating.jobPosition))];
        setJobPositions(uniquePositions);

        // Set default selected position to the first one
        if (uniquePositions.length > 0) {
          setSelectedPosition(uniquePositions[0]);
        }

        setLoading(false);
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
      }
    };

    fetchRatings();
  }, []);

  // Effect to update chart when selected position changes
  useEffect(() => {
    if (!originalData || !selectedPosition) return;

    // Filter ratings for the selected job position
    const filteredRatings = originalData.ratings.filter(
      rating => rating.jobPosition === selectedPosition
    );

    // Process the filtered data
    const labels: string[] = [];
    const ratings: number[] = [];

    filteredRatings.forEach((rating, index) => {
      const label = `${rating.jobPosition.slice(0, 8)}#${index + 1}`;
      labels.push(label);
      const ratingValue =
        rating.answers.length > 0 ? rating.answers[0].Intervieweerating : 0;
      ratings.push(ratingValue);
    });

    // Set up Chart.js data with gradient
    const ctx = document.createElement("canvas").getContext("2d");
    const gradient = ctx?.createLinearGradient(0, 0, 0, 400);
    gradient?.addColorStop(0, "rgba(6, 182, 212, 0.8)");  // Tailwind cyan-500
    gradient?.addColorStop(1, "rgba(6, 182, 212, 0.2)");  // Lighter cyan

    setChartData({
      labels: labels,
      datasets: [
        {
          label: `Interviewer Rating - ${selectedPosition}`,
          data: ratings,
          fill: true,
          backgroundColor: gradient,
          borderColor: "rgba(6, 182, 212, 1)",  // Tailwind cyan-500
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: "white",
          pointBorderColor: "rgba(6, 182, 212, 1)",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: "rgba(6, 182, 212, 1)",
        },
      ],
    });
  }, [selectedPosition, originalData]);

  // Updated chart options with modern styling
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        grid: {
          color: "rgba(6, 182, 212, 0.1)",  // Soft cyan grid lines
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: "rgba(6, 182, 212, 0.7)",
          font: {
            size: 10,
          },
          padding: 10,
        }
      },
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: "rgba(6, 182, 212, 0.7)",
          font: {
            size: 10,
          },
          padding: 10,
          maxRotation: 0,
          autoSkip: true,
          autoSkipPadding: 20,
        }
      },
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    },
    hover: {
      mode: 'nearest',
      intersect: true
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64 bg-[#2c3e50] rounded-2xl">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-cyan-500"></div>
    </div>
  );

  if (error) return (
    <div className="text-center text-red-400 bg-[#2c3e50] rounded-2xl p-6">
      Error: {error}
    </div>
  );

  return (
    <div className="w-full bg-[#2c3e50] rounded-2xl p-6 shadow-2xl border border-[#3a4b5c]">
      {/* Modern Dropdown */}
      <div className="relative mb-4">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex justify-between items-center bg-[#3a4b5c] text-white px-4 py-3 rounded-lg"
        >
          <span className="text-sm">{selectedPosition}</span>
          <ChevronDown className="w-5 h-5 text-cyan-400" />
        </button>

        {isDropdownOpen && (
          <div className="absolute z-10 mt-2 w-full bg-[#3a4b5c] rounded-lg shadow-2xl border border-[#4a5b6d]">
            {jobPositions.map((position) => (
              <div
                key={position}
                onClick={() => {
                  setSelectedPosition(position);
                  setIsDropdownOpen(false);
                }}
                className="px-4 py-2 hover:bg-[#4a5b6d] text-white text-sm cursor-pointer first:rounded-t-lg last:rounded-b-lg"
              >
                {position}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chart Container with Gradient Background */}
      <div className="h-64 relative">
        {chartData ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="text-center text-gray-400">No data available</div>
        )}
      </div>

      {/* Chart Description */}
      <div className="mt-4 text-center">
        <p className="text-sm text-cyan-400">
          Interview Performance Trend for {selectedPosition}
        </p>
      </div>
    </div>
  );
};

export default RatingsChart;
