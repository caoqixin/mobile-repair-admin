import { Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import { IRepairStatusStats } from "../../interface";

interface RepairStatusStatsProps {
  chartData: IRepairStatusStats[];
}

const CustomPieShape = (props: any) => {
  // 从 props 中解构出原始数据 payload，里面包含我们在 pieChartData 里定义的 color
  const { payload, ...rest } = props;

  return (
    <Sector
      {...rest}
      fill={payload.color} // 使用数据项中的颜色
      // 可以在这里添加 hover 效果或其他 SVG 属性
      stroke="#fff"
      strokeWidth={2}
    />
  );
};

export const RepairStatusStats = ({ chartData }: RepairStatusStatsProps) => {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius="80%"
          outerRadius="100%"
          // Corner radius is the rounded edge of each pie slice
          cornerRadius="50%"
          fill="#8884d8"
          // padding angle is the gap between each pie slice
          paddingAngle={5}
          label
          dataKey="value"
          shape={CustomPieShape}
          isAnimationActive={true}
        />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};
