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
          innerRadius={55}
          outerRadius={75}
          paddingAngle={4}
          dataKey="value"
          shape={CustomPieShape}
          isAnimationActive={true}
        />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};
