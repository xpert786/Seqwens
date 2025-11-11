import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ReportingView = () => {
  const openData = [{ name: "Open", value: 23, maxValue: 24 }];
  const overdueData = [{ name: "Completed", value: 1, maxValue: 3 }];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
          <p className="text-sm font-semibold text-[#EF4444]">
            Tasks: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom bar shape with light grey background
  const CustomBarShape = (props) => {
    const { fill, x, y, width, height, payload } = props;
    const maxHeight = height * (payload.maxValue / payload.value);
    const heightDiff = maxHeight - height;

    return (
      <g>
        {/* Background bar (light grey) - extends to maxValue, slightly wider */}
        <rect
          x={x - 3}
          y={y - heightDiff}
          width={width + 6}
          height={maxHeight}
          fill="#E5E7EB"
          rx={4}
        />
        {/* Foreground bar (red) - shows actual value */}
        <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />
      </g>
    );
  };

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Vs Completed Chart */}
        <div className="bg-white rounded-lg !border border-[#E8F0FF] p-6">
          <h5 className="text-base font-semibold text-gray-700 mb-6 font-[BasisGrotesquePro]">
            Open Vs Completed
          </h5>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={openData}
              margin={{ top: 20, right: 30, left: 2, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                axisLine={{ stroke: "#000000", strokeWidth: 1 }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 24]}
                ticks={[0, 6, 12, 18, 24]}
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                axisLine={{ stroke: "#000000", strokeWidth: 1 }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar
                dataKey="value"
                fill="#EF4444"
                shape={<CustomBarShape fill="#EF4444" />}
                radius={[0, 0, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Overdue Heatmap (By Staff) Chart */}
        <div className="bg-white !rounded-lg  !border border-[#E8F0FF] p-6">
          <h5 className="text-base font-semibold text-gray-700 mb-6 font-[BasisGrotesquePro]">
            Overdue Heatmap (By Staff)
          </h5>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={overdueData}
              margin={{ top: 20, right: 30, left: 2, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                axisLine={{ stroke: "#000000", strokeWidth: 1 }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 24]}
                ticks={[0, 6, 12, 18, 24]}
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                axisLine={{ stroke: "#000000", strokeWidth: 1 }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar
                dataKey="value"
                fill="#EF4444"
                shape={<CustomBarShape fill="#EF4444" />}
                radius={[0, 0, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ReportingView;
