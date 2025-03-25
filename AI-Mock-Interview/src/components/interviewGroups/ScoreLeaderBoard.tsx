import { CategoryScale, Chart, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface UserScore {
  score: number;
  name: string;
}

interface ScoresData {
  [userId: string]: UserScore;
}

const InterviewStandingsGraph = ({ groupId }: { groupId: string }) => {
  // Initialize with localStorage if available
  const [scores, setScores] = useState<ScoresData>(() => {
    const savedScores = localStorage.getItem(`scores_${groupId}`);
    return savedScores ? JSON.parse(savedScores) : {};
  });

  const [pollingStatus, setPollingStatus] = useState<string>("stopped");
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Save scores to localStorage when they change
  useEffect(() => {
    if (Object.keys(scores).length > 0) {
      localStorage.setItem(`scores_${groupId}`, JSON.stringify(scores));
    }
  }, [scores, groupId]);

  // Fetch scores function
  const fetchScores = async () => {
    try {
      setPollingStatus("fetching");
      const response = await fetch(`/api/interview-groups/${groupId}/scores`);

      if (!response.ok) {
        throw new Error(`Failed to fetch scores: ${response.status}`);
      }

      const updatedScores = await response.json();
      console.log("Scores fetched:", updatedScores);

      // Only update if we got valid scores
      if (updatedScores && Object.keys(updatedScores).length > 0) {
        setScores(prevScores => {
          const newScores = {...prevScores};

          Object.keys(updatedScores).forEach(userId => {
            if (updatedScores[userId] &&
                typeof updatedScores[userId].score === 'number') {
              newScores[userId] = updatedScores[userId];
            }
          });

          return newScores;
        });

        setPollingStatus("success");
      }
    } catch (error) {
      console.error("Error fetching scores:", error);
      setPollingStatus("error: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  // Start long polling
  const startPolling = () => {
    // Stop any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Start new polling interval
    const newInterval = setInterval(() => {
      fetchScores();
    }, 5000); // Poll every 5 seconds

    setPollingInterval(newInterval);
    setPollingStatus("polling");
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      setPollingStatus("stopped");
    }
  };

  // Initial fetch and start polling on component mount
  useEffect(() => {
    // Fetch initial scores
    fetchScores();

    // Start polling
    startPolling();

    // Cleanup function
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [groupId]); // Re-run if groupId changes

  // Transform the nested data structure for the chart
  const chartData = {
    labels: Object.values(scores).map(user => user.name),
    datasets: [
      {
        label: 'Participant Scores',
        data: Object.values(scores).map(user => user.score),
        fill: false,
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  const options = {
    responsive: true,
    animation: {
      duration: 500
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div>
      <h3>Interview Standings</h3>
      <div style={{
        color: pollingStatus === "success" ? "green" :
               pollingStatus === "polling" ? "green" :
               pollingStatus.includes("error") ? "red" : "orange",
        marginBottom: "10px"
      }}>
        Polling Status: {pollingStatus}
        {pollingStatus !== "polling" && (
          <button
            onClick={startPolling}
            style={{ marginLeft: "10px", padding: "2px 8px" }}
          >
            Start Polling
          </button>
        )}
        {pollingStatus === "polling" && (
          <button
            onClick={stopPolling}
            style={{ marginLeft: "10px", padding: "2px 8px" }}
          >
            Stop Polling
          </button>
        )}
      </div>
      {Object.keys(scores).length === 0 ? (
        <p>Loading data...</p>
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
};

export default InterviewStandingsGraph;
