import React, { useMemo, useState } from "react";
import { useList, useNavigation } from "@refinedev/core";
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Table,
  Tag,
  Progress,
  List,
  Avatar,
  Flex,
  Modal,
  Space,
  Button,
  Divider,
  Badge,
  Skeleton,
} from "antd";
import {
  DollarCircleOutlined,
  ToolOutlined,
  GoldOutlined,
  ShoppingOutlined,
  SyncOutlined,
  HistoryOutlined,
  BarChartOutlined,
  MobileOutlined,
  RightOutlined,
  TrophyFilled,
  CalendarOutlined,
  AppstoreOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import {
  LineChart, // 🔥 改用折线图
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
  BarChart,
  Bar,
  Sector,
} from "recharts";
import dayjs from "dayjs";
// 引入刚刚创建的悬浮组件
import { QuickActionsWidget } from "../../components/actions";

const { Text } = Typography;

// --- 颜色常量 ---
const COLORS = {
  primary: "#1890ff",
  success: "#52c41a",
  warning: "#faad14",
  error: "#ff4d4f",
  purple: "#722ed1",
  cyan: "#13c2c2",
  pink: "#eb2f96",
};
// 排行榜颜色辅助函数
const getRankColor = (index: number) => {
  switch (index) {
    case 0:
      return "#FFD700"; // 金
    case 1:
      return "#C0C0C0"; // 银
    case 2:
      return "#CD7F32"; // 铜
    default:
      return "#1890ff"; // 普通
  }
};

// 🔥 核心修改：定义自定义扇形渲染组件
// Recharts 会将当前扇区的所有属性（角度、半径等）以及 payload（原始数据）传给这个组件
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

export const Dashboard = () => {
  const { list } = useNavigation();

  // --- 状态控制 ---
  const [isYearlyModalOpen, setIsYearlyModalOpen] = useState(false);
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
  const [isModelsModalOpen, setIsModelsModalOpen] = useState(false);

  // --- 1. 从 SQL View 获取数据 ---

  // A. 年度数据
  const {
    query: { data: yearlyData, isLoading: yearlyLoading },
  } = useList({
    resource: "dashboard_yearly_stats",
    pagination: { mode: "off" },
    sorters: [{ field: "year", order: "desc" }],
  });

  // B. 月度数据
  const {
    query: { data: monthlyData, isLoading: monthlyLoading },
  } = useList({
    resource: "dashboard_monthly_stats",
    pagination: { mode: "off" },
    sorters: [{ field: "month_str", order: "asc" }], // 按时间正序排列以便画图
    filters: [
      { field: "year", operator: "eq", value: dayjs().year() }, // 只取今年的用于默认展示
    ],
  });

  // C. 库存汇总
  const {
    query: { data: inventoryData, isLoading: inventoryLoading },
  } = useList({
    resource: "dashboard_inventory_summary",
    pagination: { mode: "off" },
  });

  // D. 状态分布
  const {
    query: { data: statusData, isLoading: statusLoading },
  } = useList({
    resource: "dashboard_status_stats",
    pagination: { mode: "off" },
  });

  // E. 热门机型
  const {
    query: { data: topModelsData, isLoading: modelsLoading },
  } = useList({
    resource: "dashboard_top_models",
    pagination: { mode: "off" },
  });

  // --- 2. 数据处理 ---

  const currentYearStats = yearlyData?.data?.find(
    (d: any) => d.year === dayjs().year(),
  ) || { repair_count: 0, total_revenue: 0 };

  // 🔥 新增：本月数据
  const currentMonthStats = monthlyData?.data?.find(
    (d: any) => d.month === dayjs().month() + 1,
  ) || { repair_count: 0, total_revenue: 0 };

  // 🔥 新增：库存细分数据
  const componentsStats = inventoryData?.data?.find(
    (d: any) => d.category === "components",
  ) || { total_value: 0, total_quantity: 0 };
  const itemsStats = inventoryData?.data?.find(
    (d: any) => d.category === "items",
  ) || { total_value: 0, total_quantity: 0 };

  const pieChartData = useMemo(() => {
    const raw = statusData?.data || [];
    const map: any = {};
    raw.forEach((r: any) => (map[r.status] = Number(r.count)));

    return [
      {
        name: "待处理",
        value: (map["pending_check"] || 0) + (map["pending_quote"] || 0),
        color: COLORS.warning,
      },
      {
        name: "维修中",
        value: (map["repairing"] || 0) + (map["waiting_parts"] || 0),
        color: COLORS.primary,
      },
      { name: "已完成", value: map["completed"] || 0, color: COLORS.success },
      { name: "已取消", value: map["cancelled"] || 0, color: "#d9d9d9" },
    ].filter((i) => i.value > 0);
  }, [statusData]);

  const activeRepairsCount = pieChartData
    .filter((d) => ["待处理", "维修中"].includes(d.name))
    .reduce((a, b) => a + b.value, 0);

  const allModels = topModelsData?.data || [];
  const top5Models = allModels.slice(0, 5);
  const maxModelCount = allModels[0]?.repair_count || 1;

  // --- 3. 组件 ---

  const KpiCard = ({
    title,
    value,
    prefix,
    suffix,
    color,
    icon,
    footer,
    onClick,
    loading,
  }: any) => (
    <Card
      variant="borderless"
      styles={{ body: { padding: 20, height: "100%" } }}
      hoverable={!!onClick}
      onClick={loading ? undefined : onClick}
      style={{ cursor: onClick && !loading ? "pointer" : "default" }}
    >
      {/* 如果 loading 为 true，显示骨架屏 */}
      <Skeleton loading={loading} active avatar paragraph={{ rows: 1 }}>
        <Flex justify="space-between" align="start">
          <div>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {title}
            </Text>
            <div style={{ marginTop: 8 }}>
              <Statistic
                value={value}
                prefix={prefix}
                suffix={suffix}
                valueStyle={{ fontWeight: 600, fontSize: 24 }}
              />
            </div>
            {footer && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#8c8c8c" }}>
                {footer}
              </div>
            )}
          </div>
          <Avatar
            shape="square"
            size={48}
            icon={icon}
            style={{
              backgroundColor: `${color}15`,
              color: color,
              borderRadius: 12,
            }}
          />
        </Flex>
      </Skeleton>
    </Card>
  );

  return (
    <div style={{ padding: 0 }}>
      {/* 🔥 引入左侧悬浮操作窗 */}
      <QuickActionsWidget />
      {/* 顶部 KPI 区域 */}
      {/* 第一行：年度核心数据 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={yearlyLoading}
            title={`${dayjs().year()} 年度总收入`}
            value={currentYearStats.total_revenue}
            prefix="€"
            color={COLORS.success}
            icon={<DollarCircleOutlined />}
            footer={
              <Space>
                <HistoryOutlined /> 点击查看往年
              </Space>
            }
            onClick={() => setIsYearlyModalOpen(true)}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={yearlyLoading}
            title={`${dayjs().year()} 年度维修量`}
            value={currentYearStats.repair_count}
            suffix="单"
            color={COLORS.primary}
            icon={<BarChartOutlined />}
            footer={
              <Space>
                <HistoryOutlined /> 点击查看往年
              </Space>
            }
            onClick={() => setIsYearlyModalOpen(true)}
          />
        </Col>

        {/* 🔥 新增：月度数据 */}
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={monthlyLoading}
            title={`${dayjs().month() + 1}月 收入/单量`}
            value={currentMonthStats.total_revenue}
            prefix="€"
            suffix={` / ${currentMonthStats.repair_count}单`}
            color={COLORS.cyan}
            icon={<CalendarOutlined />}
            footer={
              <Space>
                <RightOutlined /> 查看本年趋势
              </Space>
            }
            onClick={() => setIsMonthlyModalOpen(true)}
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={statusLoading}
            title="当前进行中 (Active)"
            value={activeRepairsCount}
            suffix="单"
            color={COLORS.warning}
            icon={<SyncOutlined spin />}
            footer="需尽快处理"
            onClick={() => list("repair_orders")}
          />
        </Col>
      </Row>

      {/* 第二行：库存资产详情 (新需求) */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={12}>
          {/* 🔥 维修配件统计 */}
          <KpiCard
            loading={inventoryLoading}
            title="维修配件 (Parts)"
            value={componentsStats.total_value}
            prefix="€"
            suffix={` / ${componentsStats.total_quantity}件`}
            color={COLORS.purple}
            icon={<ToolOutlined />}
            footer="用于维修消耗"
            onClick={() => list("inventory_components")}
          />
        </Col>
        <Col xs={24} sm={12} lg={12}>
          {/* 🔥 前台商品统计 */}
          <KpiCard
            loading={inventoryLoading}
            title="前台商品 (Retail)"
            value={itemsStats.total_value}
            prefix="€"
            suffix={` / ${itemsStats.total_quantity}件`}
            color={COLORS.pink}
            icon={<ShopOutlined />}
            footer="用于直接销售"
            onClick={() => list("inventory_items")}
          />
        </Col>
        {/* 这里留了两个空位，可以根据需要扩展，或者让上面的卡片宽一点 */}
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* --- 主图表：本年趋势 --- */}
        <Col xs={24} lg={16}>
          <Card
            variant="borderless"
            title={`${dayjs().year()}年 营收趋势`}
            style={{ height: "100%" }}
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => setIsYearlyModalOpen(true)}
              >
                查看往年数据
              </Button>
            }
          >
            <div style={{ width: "100%", height: 380, minHeight: 380 }}>
              {monthlyLoading ? (
                // 显示一个大的矩形 Skeleton
                <Skeleton.Node active style={{ width: "100%", height: 380 }}>
                  {/* 必须有子元素占位，或者留空 */}
                  <div />
                </Skeleton.Node>
              ) : (
                <LineChart
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  responsive
                  data={monthlyData?.data || []}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="month_str"
                    padding={{ left: 20, right: 20 }}
                  />
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
                    stroke={COLORS.success}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="repair_count"
                    name="单量"
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              )}
            </div>
          </Card>
        </Col>

        {/* --- 饼图：状态分布 --- */}
        <Col xs={24} lg={8}>
          <Card
            title="订单状态分布"
            variant="borderless"
            style={{ height: "100%" }}
          >
            <div style={{ width: "100%", height: 220, minHeight: 220 }}>
              {statusLoading ? (
                <Skeleton.Node active style={{ width: "100%", height: 220 }} />
              ) : (
                <PieChart
                  responsive
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <Pie
                    data={pieChartData}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    shape={CustomPieShape}
                    isAnimationActive={true}
                  />
                  <Tooltip />
                </PieChart>
              )}
            </div>
            {/* 🔥 新增：底部文字数据列表 */}
            <div style={{ marginTop: 0 }}>
              {statusLoading ? (
                <Skeleton
                  active
                  paragraph={{ rows: 3 }}
                  title={false}
                  style={{ marginTop: 20 }}
                />
              ) : (
                <List
                  size="small"
                  dataSource={pieChartData}
                  split={false}
                  renderItem={(item: any) => (
                    <List.Item style={{ padding: "6px 0" }}>
                      <Flex justify="space-between" style={{ width: "100%" }}>
                        <Space>
                          <Badge color={item.color} />
                          <Text>{item.name}</Text>
                        </Space>
                        <Text strong>{item.value} 单</Text>
                      </Flex>
                    </List.Item>
                  )}
                />
              )}
            </div>
          </Card>
        </Col>

        {/* --- 热门机型 (Top 5 & 颜色优化) --- */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <MobileOutlined /> 热门机型 Top 5
              </Space>
            }
            variant="borderless"
            style={{ height: "100%" }}
          >
            {/* 🔥 列表 Loading 处理 */}
            <Skeleton loading={modelsLoading} active paragraph={{ rows: 5 }}>
              <List
                itemLayout="horizontal"
                dataSource={top5Models}
                renderItem={(item: any, index: number) => {
                  const percent = (item.repair_count / maxModelCount) * 100;
                  const rankColor = getRankColor(index);
                  return (
                    <List.Item style={{ border: "none", padding: "10px 0" }}>
                      <div style={{ width: "100%" }}>
                        <Flex
                          justify="space-between"
                          align="center"
                          style={{ marginBottom: 6 }}
                        >
                          <Space>
                            {index < 3 ? (
                              <TrophyFilled
                                style={{ color: rankColor, fontSize: 16 }}
                              />
                            ) : (
                              <Tag color="default">#{index + 1}</Tag>
                            )}
                            <Text strong>{item.model_name}</Text>
                          </Space>
                          <Text strong>{item.repair_count} 单</Text>
                        </Flex>
                        <Progress
                          percent={percent}
                          showInfo={false}
                          strokeColor={rankColor}
                          size="small"
                          trailColor="#f5f5f5"
                        />
                      </div>
                    </List.Item>
                  );
                }}
              />
              {allModels.length > 5 && (
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <Button onClick={() => setIsModelsModalOpen(true)}>
                    查看完整榜单 <RightOutlined />
                  </Button>
                </div>
              )}
            </Skeleton>
          </Card>
        </Col>
      </Row>

      {/* --- Modal: 历史年份数据 --- */}
      <Modal
        title="历年营收数据"
        open={isYearlyModalOpen}
        onCancel={() => setIsYearlyModalOpen(false)}
        footer={null}
        width={700}
        destroyOnHidden
      >
        <Table
          dataSource={yearlyData?.data}
          rowKey="year"
          pagination={false}
          columns={[
            { title: "年份", dataIndex: "year", key: "year" },
            { title: "维修单量", dataIndex: "repair_count", key: "count" },
            {
              title: "总收入",
              dataIndex: "total_revenue",
              key: "revenue",
              render: (val) => (
                <Text strong style={{ color: COLORS.success }}>
                  € {Number(val).toFixed(2)}
                </Text>
              ),
            },
          ]}
        />
        {isYearlyModalOpen && (
          <div
            style={{
              width: "100%",
              height: 300,
              minHeight: 300,
              marginTop: 24,
            }}
          >
            <BarChart
              data={yearlyData?.data}
              responsive
              style={{
                width: "100%",
                height: "100%",
              }}
            >
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="total_revenue"
                name="收入"
                fill={COLORS.success}
                barSize={20}
              />
              <Bar
                dataKey="repair_count"
                name="维修"
                fill={COLORS.primary}
                barSize={20}
              />
            </BarChart>
          </div>
        )}
      </Modal>

      {/* --- Modal: 本年月度详情 --- */}
      <Modal
        title={`${dayjs().year()}年 月度详情`}
        open={isMonthlyModalOpen}
        onCancel={() => setIsMonthlyModalOpen(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={monthlyData?.data}
          rowKey="month_str"
          pagination={false}
          size="small"
          columns={[
            { title: "月份", dataIndex: "month_str" },
            { title: "单量", dataIndex: "repair_count" },
            {
              title: "收入",
              dataIndex: "total_revenue",
              render: (val) => `€ ${Number(val).toFixed(2)}`,
            },
          ]}
        />
      </Modal>

      {/* --- Modal: 所有机型排行 --- */}
      <Modal
        title="所有维修机型统计"
        open={isModelsModalOpen}
        onCancel={() => setIsModelsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Table
          dataSource={allModels}
          rowKey="model_name"
          pagination={{ pageSize: 10 }}
          size="small"
          columns={[
            {
              title: "排名",
              render: (_, __, index) => index + 1,
              width: 80,
            },
            { title: "机型名称", dataIndex: "model_name" },
            {
              title: "维修次数",
              dataIndex: "repair_count",
              sorter: (a, b) => a.repair_count - b.repair_count,
              defaultSortOrder: "descend",
              render: (val) => <Tag color="blue">{val}</Tag>,
            },
          ]}
        />
      </Modal>
    </div>
  );
};
