import React, { Suspense, useCallback, useMemo, useState } from "react";
import { useList, useNavigation, useTranslate } from "@refinedev/core";
import {
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Progress,
  List,
  Flex,
  Space,
  Button,
  Badge,
  Skeleton,
  Spin,
} from "antd";
import {
  DollarCircleOutlined,
  ToolOutlined,
  SyncOutlined,
  HistoryOutlined,
  BarChartOutlined,
  MobileOutlined,
  RightOutlined,
  TrophyFilled,
  CalendarOutlined,
  ShopOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
// 引入刚刚创建的悬浮组件
import { KpiCard } from "../../components/cards";

import { COLORS_BASE } from "../../constants";
import { getRankColor } from "../../lib/utils";
import {
  IInventorySummary,
  IMonthlyStats,
  IRepairStatusStats,
  IStatusStats,
  ITopModels,
  IYearlyStats,
} from "../../interface";

const QuickActionsWidget = React.lazy(() =>
  import("../../components/actions").then((module) => ({
    default: module.QuickActionsWidget,
  })),
);

const YearlyDataModal = React.lazy(() =>
  import("../../components/modals").then((module) => ({
    default: module.YearlyDataModal,
  })),
);

const MonthlyDataModal = React.lazy(() =>
  import("../../components/modals").then((module) => ({
    default: module.MonthlyDataModal,
  })),
);
const ModelsDataModal = React.lazy(() =>
  import("../../components/modals").then((module) => ({
    default: module.ModelsDataModal,
  })),
);

const MonthlyRevenue = React.lazy(() =>
  import("../../components/charts").then((module) => ({
    default: module.MonthlyRevenue,
  })),
);

const RepairStatusStats = React.lazy(() =>
  import("../../components/charts").then((module) => ({
    default: module.RepairStatusStats,
  })),
);
const { Text } = Typography;

export const Dashboard = () => {
  const translate = useTranslate();
  const { list } = useNavigation();

  // --- 状态控制 ---
  const [isYearlyModalOpen, setIsYearlyModalOpen] = useState(false);
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
  const [isModelsModalOpen, setIsModelsModalOpen] = useState(false);

  const openYearlyModal = useCallback(() => setIsYearlyModalOpen(true), []);
  const openMonthlyModal = useCallback(() => setIsMonthlyModalOpen(true), []);
  const openModelsModal = useCallback(() => setIsModelsModalOpen(true), []);

  // --- 从 SQL View 获取数据 ---

  // 年度数据
  const {
    query: { data: yearlyData, isLoading: yearlyLoading },
  } = useList<IYearlyStats>({
    resource: "dashboard_yearly_stats",
    pagination: { mode: "off" },
    sorters: [{ field: "year", order: "desc" }],
  });

  // 月度数据
  const {
    query: { data: monthlyData, isLoading: monthlyLoading },
  } = useList<IMonthlyStats>({
    resource: "dashboard_monthly_stats",
    pagination: { mode: "off" },
    sorters: [{ field: "month_str", order: "asc" }], // 按时间正序排列以便画图
    filters: [
      { field: "year", operator: "eq", value: dayjs().year() }, // 只取今年的用于默认展示
    ],
  });

  // 库存汇总
  const {
    query: { data: inventoryData, isLoading: inventoryLoading },
  } = useList<IInventorySummary>({
    resource: "dashboard_inventory_summary",
    pagination: { mode: "off" },
  });

  // 状态分布
  const {
    query: { data: statusData, isLoading: statusLoading },
  } = useList<IStatusStats>({
    resource: "dashboard_status_stats",
    pagination: { mode: "off" },
  });

  // 热门机型
  const {
    query: { data: topModelsData, isLoading: modelsLoading },
  } = useList<ITopModels>({
    resource: "dashboard_top_models",
    pagination: { mode: "off" },
  });

  // ---  数据处理 ---

  const currentYearStats = useMemo(
    () =>
      yearlyData?.data?.find(
        (d: IYearlyStats) => d.year === dayjs().year(),
      ) || {
        repair_count: 0,
        total_revenue: 0,
      },
    [yearlyData],
  );

  // 本月数据
  const currentMonthStats = useMemo(
    () =>
      monthlyData?.data?.find(
        (d: IMonthlyStats) => d.month === dayjs().month() + 1,
      ) || {
        repair_count: 0,
        total_revenue: 0,
      },
    [monthlyData],
  );

  // 库存细分数据
  const componentsStats = useMemo(
    () =>
      inventoryData?.data?.find(
        (d: IInventorySummary) => d.category === "components",
      ) || {
        total_value: 0,
        total_quantity: 0,
      },
    [inventoryData],
  );
  const itemsStats = useMemo(
    () =>
      inventoryData?.data?.find(
        (d: IInventorySummary) => d.category === "items",
      ) || {
        total_value: 0,
        total_quantity: 0,
      },
    [inventoryData],
  );

  const pieChartData = useMemo(() => {
    const raw = statusData?.data || [];
    const map: Record<string, number> = {};
    raw.forEach((r: IStatusStats) => (map[r.status] = Number(r.count)));

    return [
      {
        name: translate("repair_status.pending_check"),
        value: (map["pending_check"] || 0) + (map["pending_quote"] || 0),
        color: COLORS_BASE.warning,
      },
      {
        name: translate("repair_status.repairing"),
        value: (map["repairing"] || 0) + (map["waiting_parts"] || 0),
        color: COLORS_BASE.primary,
      },
      {
        name: translate("repair_status.completed"),
        value: map["completed"] || 0,
        color: COLORS_BASE.success,
      },
      {
        name: translate("repair_status.delivered"),
        value: map["delivered"] || 0,
        color: COLORS_BASE.cyan,
      },
      {
        name: translate("repair_status.cancelled"),
        value: map["cancelled"] || 0,
        color: "#d9d9d9",
      },
    ].filter((i) => i.value > 0);
  }, [statusData, translate]);

  const activeRepairsCount = useMemo(() => {
    return pieChartData
      .filter((d) =>
        [
          translate("repair_status.pending_check"),
          translate("repair_status.repairing"),
        ].includes(d.name),
      )
      .reduce((a, b) => a + b.value, 0);
  }, [pieChartData, translate]);

  const allModels = useMemo(() => topModelsData?.data || [], [topModelsData]);
  const top5Models = allModels.slice(0, 5);
  const maxModelCount = allModels[0]?.repair_count || 1;

  return (
    <div style={{ padding: 0 }}>
      {/* 左侧悬浮操作窗 */}
      <Suspense
        fallback={
          <div style={{ height: 60, width: "100%", background: "#f0f2f5" }}>
            <Spin spinning />
          </div>
        }
      >
        <QuickActionsWidget />
      </Suspense>
      {/* 顶部 KPI 区域 */}
      {/* 第一行：年度核心数据 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={yearlyLoading}
            title={translate("dashboard.yearly_income", {
              year: dayjs().year(),
            })}
            value={currentYearStats.total_revenue}
            prefix="€"
            color={COLORS_BASE.success}
            icon={<DollarCircleOutlined />}
            footer={
              <Space>
                <HistoryOutlined /> {translate("dashboard.last_year")}
              </Space>
            }
            onClick={openYearlyModal}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={yearlyLoading}
            title={translate("dashboard.yearly_repair", {
              year: dayjs().year(),
            })}
            value={currentYearStats.repair_count}
            suffix={translate("dashboard.count")}
            color={COLORS_BASE.primary}
            icon={<BarChartOutlined />}
            footer={
              <Space>
                <HistoryOutlined /> {translate("dashboard.last_year")}
              </Space>
            }
            onClick={openYearlyModal}
          />
        </Col>

        {/* 月度数据 */}
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={monthlyLoading}
            title={translate("dashboard.monthly", {
              month: dayjs().month(),
            })}
            value={currentMonthStats.total_revenue}
            prefix="€"
            suffix={translate("dashboard.monthly_suffix", {
              count: currentMonthStats.repair_count,
            })}
            color={COLORS_BASE.cyan}
            icon={<CalendarOutlined />}
            footer={
              <Space>
                <RightOutlined />
                {translate("dashboard.year_statistic")}
              </Space>
            }
            onClick={openMonthlyModal}
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={statusLoading}
            title={translate("dashboard.kpi.title.active")}
            value={activeRepairsCount}
            suffix={translate("dashboard.kpi.suffix.active")}
            color={COLORS_BASE.warning}
            icon={<SyncOutlined spin />}
            footer={translate("dashboard.kpi.footer.active")}
            onClick={() => list("repair_orders")}
          />
        </Col>
      </Row>

      {/* 第二行：库存资产详情 */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={12}>
          {/* 🔥 维修配件统计 */}
          <KpiCard
            loading={inventoryLoading}
            title={translate("dashboard.kpi.title.parts")}
            value={componentsStats.total_value}
            prefix="€"
            suffix={translate("dashboard.kpi.suffix.parts", {
              count: componentsStats.total_quantity,
            })}
            color={COLORS_BASE.purple}
            icon={<ToolOutlined />}
            footer={translate("dashboard.kpi.footer.parts")}
            onClick={() => list("inventory_components")}
          />
        </Col>
        <Col xs={24} sm={12} lg={12}>
          {/* 🔥 前台商品统计 */}
          <KpiCard
            loading={inventoryLoading}
            title={translate("dashboard.kpi.title.retail")}
            value={itemsStats.total_value}
            prefix="€"
            suffix={translate("dashboard.kpi.suffix.retail", {
              count: itemsStats.total_quantity,
            })}
            color={COLORS_BASE.pink}
            icon={<ShopOutlined />}
            footer={translate("dashboard.kpi.footer.retail")}
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
            title={translate("dashboard.chart.income", {
              year: dayjs().year(),
            })}
            style={{ height: "100%" }}
            extra={
              <Button type="link" size="small" onClick={openYearlyModal}>
                {translate("dashboard.chart.buttons.last_year")}
              </Button>
            }
          >
            <Suspense
              fallback={
                <Skeleton
                  loading={monthlyLoading}
                  active
                  style={{ width: "100%" }}
                />
              }
            >
              <MonthlyRevenue data={monthlyData?.data || []} />
            </Suspense>
          </Card>
        </Col>

        {/* --- 饼图：状态分布 --- */}
        <Col xs={24} lg={8}>
          <Card
            title={translate("dashboard.chart.status")}
            variant="borderless"
            style={{ height: "100%" }}
          >
            <Suspense
              fallback={
                <Skeleton
                  loading={statusLoading}
                  active
                  style={{ width: "100%", height: 220 }}
                />
              }
            >
              <RepairStatusStats chartData={pieChartData} />
            </Suspense>

            {/* 底部文字数据列表 */}
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
                  renderItem={(item: IRepairStatusStats) => (
                    <List.Item style={{ padding: "6px 0" }}>
                      <Flex justify="space-between" style={{ width: "100%" }}>
                        <Space>
                          <Badge color={item.color} />
                          <Text>{item.name}</Text>
                        </Space>
                        <Text strong>
                          {item.value}
                          {translate("dashboard.count")}
                        </Text>
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
                <MobileOutlined /> {translate("dashboard.top")}
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
                renderItem={(item: ITopModels, index: number) => {
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
                          <Text strong>
                            {item.repair_count} {translate("dashboard.count")}
                          </Text>
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
                  <Button onClick={openModelsModal}>
                    {translate("dashboard.rank")} <RightOutlined />
                  </Button>
                </div>
              )}
            </Skeleton>
          </Card>
        </Col>
      </Row>

      {/* --- Modal: 历史年份数据 --- */}
      <Suspense fallback={<Spin spinning />}>
        <YearlyDataModal
          open={isYearlyModalOpen}
          onCanel={() => setIsYearlyModalOpen(false)}
          data={yearlyData?.data}
        />
      </Suspense>

      {/* --- Modal: 本年月度详情 --- */}
      <Suspense fallback={<Spin spinning />}>
        <MonthlyDataModal
          open={isMonthlyModalOpen}
          onCancel={() => setIsMonthlyModalOpen(false)}
          data={monthlyData?.data}
        />
      </Suspense>
      {/* --- Modal: 所有机型排行 --- */}
      <Suspense fallback={<Spin spinning />}>
        <ModelsDataModal
          open={isModelsModalOpen}
          data={allModels}
          onCancel={() => setIsModelsModalOpen(false)}
        />
      </Suspense>
    </div>
  );
};
