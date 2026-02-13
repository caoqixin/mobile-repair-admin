import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS_BASE } from "../../constants";
import { IMonthlyStats } from "../../interface";

interface MonthlyRevenueProps {
  data: IMonthlyStats[];
}

export const MonthlyRevenue = ({ data }: MonthlyRevenueProps) => {
  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
      >
        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="#f0f0f0"
        />
        <XAxis dataKey="month_str" padding={{ left: 20, right: 20 }} />
        <YAxis yAxisId="left" tickFormatter={(val) => `€${val}`} />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        />
        <Legend verticalAlign="top" height={36} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="total_revenue"
          name="收入 (€)"
          stroke={COLORS_BASE.success}
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="repair_count"
          name="单量"
          stroke={COLORS_BASE.primary}
          strokeWidth={3}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
