import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const ParticipantScoresChart = ({ participants }) => {
  const [sortBy, setSortBy] = useState('score'); // 'score' or 'name'

  // Convert participants to chart data format
  const chartData = participants.map(participant => ({
    name: participant.user?.name || participant.name || 'Unknown',
    score: participant.totalScore,
    averageScore: participant.averageScore || 0,
    id: participant.id,
    completionPercentage: participant.completionPercentage || 0
  }));

  // Sort the data based on current sorting preference
  const sortedData = [...chartData].sort((a, b) => {
    if (sortBy === 'score') {
      return b.score - a.score;
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  // Generate a color based on the score (green for high, red for low)
  const getBarColor = (score) => {
    // Maximum possible score is unknown, so using relative coloring
    const maxScore = Math.max(...chartData.map(item => item.score));
    const percentage = maxScore ? score / maxScore : 0;

    // Color gradient from red to yellow to green
    if (percentage > 0.7) return '#22c55e'; // Green
    if (percentage > 0.4) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <Card className="mb-8">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Participant Total Scores</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy('name')}
              className={sortBy === 'name' ? 'bg-gray-100' : ''}
            >
              Sort by Name
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy('score')}
              className={sortBy === 'score' ? 'bg-gray-100' : ''}
            >
              Sort by Score
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={{ value: 'Total Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                formatter={(value, name, props) => {
                  if (name === 'score') {
                    return [`Score: ${value}`, ''];
                  }
                }}
                labelFormatter={(label) => `Participant: ${label}`}
              />
              <Bar dataKey="score" name="Total Score">
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParticipantScoresChart;
