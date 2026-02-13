import { Card, Col, Row, Statistic, Skeleton, Empty } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { COLORS_EXPENSE, COLORS_INCOME } from "../../constants";

interface IFinancialSummary {
  month_income: number;
  month_expense: number;
  year_income: number;
  year_expense: number;
}

interface ICategoryStat {
  type: "income" | "expense";
  category: string;
  total_amount: number;
}

export const FinancialStats = () => {
  // 1. 获取核心统计数据
  const {
    query: { data: summaryData, isLoading: isLoadingSummary },
  } = useList<IFinancialSummary>({
    resource: "dashboard_financial_summary",
    pagination: { mode: "off" },
  });

  // 2. 获取分类数据
  const {
    query: { data: categoryData, isLoading: isLoadingCategory },
  } = useList<ICategoryStat>({
    resource: "dashboard_category_stats",
    pagination: { mode: "off" },
  });

  const stats = summaryData?.data?.[0];
  const categories = categoryData?.data || [];

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  // 简单的货币格式化
  const formatCurrency = (value: number) => `€${value.toFixed(2)}`;

  if (isLoadingSummary || isLoadingCategory) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  // 渲染饼图的辅助函数
  const renderPieChart = (data: ICategoryStat[], colors: string[]) => {
    if (!data || data.length === 0)
      return (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
      );

    const chartData = data.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length], // 将颜色绑定到数据上
    }));

    return (
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60} // 环形图效果
              outerRadius={80}
              paddingAngle={5}
              dataKey="total_amount"
              nameKey="category"
            />

            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div style={{ marginBottom: 24 }}>
      {/* 1. 顶部统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card variant="borderless">
            <Statistic
              title="本月收入"
              value={stats?.month_income}
              precision={2}
              valueStyle={{ color: "#3f8600" }}
              prefix={<ArrowUpOutlined />}
              suffix="€"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless">
            <Statistic
              title="本月支出"
              value={stats?.month_expense}
              precision={2}
              valueStyle={{ color: "#cf1322" }}
              prefix={<ArrowDownOutlined />}
              suffix="€"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless">
            <Statistic
              title="本年总收入"
              value={stats?.year_income}
              precision={2}
              valueStyle={{ color: "#3f8600" }}
              prefix={<ArrowUpOutlined />}
              suffix="€"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless">
            <Statistic
              title="本年总支出"
              value={stats?.year_expense}
              precision={2}
              valueStyle={{ color: "#cf1322" }}
              prefix={<ArrowDownOutlined />}
              suffix="€"
            />
          </Card>
        </Col>
      </Row>

      {/* 2. 底部图表区域 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="收入来源分析" variant="borderless">
            {renderPieChart(incomeCategories, COLORS_INCOME)}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="支出去向分析" variant="borderless">
            {renderPieChart(expenseCategories, COLORS_EXPENSE)}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
