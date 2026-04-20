import React from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

interface StrategyMetrics {
  name: string;
  hit_rate: number;
  latency_ms: number;
  cost_score: number;
  chunk_count: number;
}

interface StrategyRadarChartProps {
  data: StrategyMetrics[];
}

export default function StrategyRadarChart({ data }: StrategyRadarChartProps) {
  // Normalize data for the radar chart (values from 0 to 100)
  const normalizedData = [
    { metric: 'Accuracy', fullMark: 100 },
    { metric: 'Efficiency', fullMark: 100 }, // Inverse of Latency
    { metric: 'Economy', fullMark: 100 },    // Inverse of Cost
    { metric: 'Cohesion', fullMark: 100 },   // Structure quality
  ];

  // We need to pivot the data so each strategy is a key
  const chartData = [
    { subject: 'Accuracy', fullMark: 100 },
    { subject: 'Speed', fullMark: 100 },
    { subject: 'Cost', fullMark: 100 },
    { subject: 'Context', fullMark: 100 },
  ];

  // Find max values for normalization
  const maxLatency = Math.max(...data.map(d => d.latency_ms), 1);
  const maxCost = Math.max(...data.map(d => d.cost_score), 0.0001);

  const formattedData = chartData.map(item => {
    const entry: any = { ...item };
    data.forEach(strategy => {
      let value = 0;
      if (item.subject === 'Accuracy') value = strategy.hit_rate * 100;
      if (item.subject === 'Speed') value = (1 - strategy.latency_ms / (maxLatency * 1.2)) * 100;
      if (item.subject === 'Cost') value = (1 - strategy.cost_score / (maxCost * 1.5)) * 100;
      if (item.subject === 'Context') value = (strategy.chunk_count < 10 ? 90 : 60); // Heuristic
      
      entry[strategy.name] = Math.max(value, 10); // Minimum visibility
    });
    return entry;
  });

  const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

  return (
    <div style={{ width: '100%', height: 400, background: 'var(--glass)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)' }}>
      <h3 style={{ fontSize: '14px', marginBottom: '20px', color: 'var(--muted)', textAlign: 'center' }}>Strategy Trade-off Analysis</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={formattedData}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
          {data.map((strategy, index) => (
            <Radar
              key={strategy.name}
              name={strategy.name}
              dataKey={strategy.name}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.4}
            />
          ))}
          <Tooltip 
            contentStyle={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px' }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
