import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import PropTypes from 'prop-types';
import api from '../../api/axios';
import { useUser } from '../../contexts/UserContext';

const CustomLegend = ({ payload, data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex justify-center gap-8">
      {payload.map((entry, index) => {
        const percentage = ((data[index].value / total) * 100).toFixed(1);
        return (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">
              {data[index].name}: {data[index].value} ({percentage}%)
            </span>
          </div>
        );
      })}
    </div>
  );
};

CustomLegend.propTypes = {
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      color: PropTypes.string,
      value: PropTypes.string
    })
  ),
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.number
    })
  )
};

const FigmaPieChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser(); // ⬅️ Get logged-in user

  const COLORS = ['#3B5BDB', '#748FFC'];

  useEffect(() => {
    const fetchChartData = async () => {
      if (!user?.intra_id) return;

      try {
        const response = await api.get(`/player-stats/${user.intra_id}/`);
        const { wins, losses } = response.data;

        setChartData([
          { name: 'Win', value: wins },
          { name: 'Loss', value: losses }
        ]);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setChartData([
          { name: 'Win', value: 32 },
          { name: 'Loss', value: 28 }
        ]);
      }

      setLoading(false);
    };

    fetchChartData();
  }, [user]);

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-96">
      <div className="text-2xl text-gray-700 mb-4 text-center">
      — Win/Loss Ratio — 
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="90%"
            fill="#8884d8"
            paddingAngle={0}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                stroke="none"
              />
            ))}
          </Pie>
          <Legend content={(props) => <CustomLegend {...props} data={chartData} />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FigmaPieChart;
