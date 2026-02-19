import { Card, Col, Row, Statistic, Skeleton, Empty } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { useList, useTranslate } from "@refinedev/core";
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { COLORS_EXPENSE, COLORS_INCOME } from "../../constants";
import { formatCurrency } from "../../lib/utils";

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
  const translate = useTranslate();
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

  if (isLoadingSummary || isLoadingCategory) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  // 渲染饼图的辅助函数
  const renderPieChart = (data: ICategoryStat[], colors: string[]) => {
    if (!data || data.length === 0)
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={translate("transactions.chart.empty")}
        />
      );

    const chartData = data.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length], // 将颜色绑定到数据上
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
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
    );
  };

  return (
    <div style={{ marginBottom: 24 }}>
      {/* 1. 顶部统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card variant="borderless">
            <Statistic
              title={translate("transactions.chart.month_income")}
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
              title={translate("transactions.chart.month_expense")}
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
              title={translate("transactions.chart.year_income")}
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
              title={translate("transactions.chart.year_expense")}
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
          <Card
            title={translate("transactions.chart.income_analysis")}
            variant="borderless"
          >
            {renderPieChart(incomeCategories, COLORS_INCOME)}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={translate("transactions.chart.expense_analys")}
            variant="borderless"
          >
            {renderPieChart(expenseCategories, COLORS_EXPENSE)}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
