import React, { useMemo, useState } from "react";
import { useList, useTranslate } from "@refinedev/core";
import {
  Card,
  Space,
  Skeleton,
  Button,
  Modal,
  Table,
  Tag,
  Typography,
  Row,
  Col,
  Flex,
} from "antd";
import { WarningOutlined, RightOutlined } from "@ant-design/icons";
import {
  PieChart,
  Pie,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { IFaultModelBreakdown, IFaultStats } from "../../interface";
import { getRankColor } from "../../lib/utils"; // 确保路径正确
import { FAULT_COLORS } from "../../constants";

export const FaultStats = () => {
  const translate = useTranslate();
  const [isFaultModalOpen, setIsFaultModalOpen] = useState(false);

  // 获取数据
  const {
    query: { data: faultData, isLoading: faultLoading },
  } = useList<IFaultStats>({
    resource: "dashboard_fault_stats",
    pagination: { mode: "off" },
  });

  // 提前解析并排好序，避免渲染时卡顿
  const allFaults = useMemo(() => {
    const rawData = faultData?.data || [];
    return rawData.map((item) => {
      let breakdown: IFaultModelBreakdown[] = [];

      // 1. 安全解析 JSON
      if (Array.isArray(item.models_breakdown)) {
        breakdown = [...item.models_breakdown];
      } else if (typeof item.models_breakdown === "string") {
        try {
          breakdown = JSON.parse(item.models_breakdown);
        } catch (e) {}
      }

      // 2. 提前做好排序 (降序)
      breakdown.sort((a, b) => b.count - a.count);

      // 将处理好的数组挂载到一个新属性上
      return { ...item, parsed_breakdown: breakdown };
    });
  }, [faultData]);

  // 饼图数据聚合 (Top 5 + 其他)
  const pieData = useMemo(() => {
    if (!allFaults || allFaults.length === 0) return [];

    // 取前 5 名
    const top5 = allFaults.slice(0, 5);
    // 取剩下的所有
    const others = allFaults.slice(5);

    const result = top5.map((item, index) => ({
      ...item,
      fill: FAULT_COLORS[index % FAULT_COLORS.length],
    }));

    // 如果还有其他数据，把它们合并成一项 "其他"
    if (others.length > 0) {
      const othersCount = others.reduce(
        (sum, item) => sum + (Number(item.repair_count) || 0),
        0,
      );
      result.push({
        fault_name: translate("dashboard.others"),
        repair_count: othersCount,
        fill: "#d9d9d9", // 灰色表示其他
        models_breakdown: [],
      } as any);
    }

    return result;
  }, [allFaults, translate]);

  return (
    <>
      <Card
        title={
          <Space>
            <WarningOutlined style={{ color: "#faad14" }} />
            {translate("dashboard.fault_stats")}
          </Space>
        }
        variant="borderless"
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
        styles={{
          body: { flex: 1, display: "flex", flexDirection: "column", gap: 32 },
        }}
      >
        <Skeleton loading={faultLoading} active>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="repair_count"
                nameKey="fault_name"
                label={(props: any) =>
                  `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`
                }
              ></Pie>
              <RechartsTooltip
                formatter={(value: any) => [
                  `${value || 0} ${translate("dashboard.count")}`,
                  translate("dashboard.repair_count"),
                ]}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>

          <div style={{ textAlign: "center", marginTop: 16, paddingBottom: 8 }}>
            <Button onClick={() => setIsFaultModalOpen(true)}>
              {translate("dashboard.view_details")} <RightOutlined />
            </Button>
          </div>
        </Skeleton>
      </Card>

      {/* 详情模态框 */}
      <Modal
        title={translate("dashboard.fault_details")}
        open={isFaultModalOpen}
        onCancel={() => setIsFaultModalOpen(false)}
        footer={null}
        width={750}
      >
        <Table<IFaultStats>
          dataSource={allFaults} // 列表中依然展示所有数据，不受 Top 5 限制
          rowKey="fault_name"
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: translate("dashboard.fault_rank"),
              key: "rank",
              width: 80,
              render: (_, __, index) => (
                <Tag color={index < 3 ? getRankColor(index) : "default"}>
                  #{index + 1}
                </Tag>
              ),
            },
            {
              title: translate("dashboard.fault_name"),
              dataIndex: "fault_name",
              key: "fault_name",
              render: (text) => (
                <Typography.Text strong>{text}</Typography.Text>
              ),
            },
            {
              title: translate("dashboard.repair_count"),
              dataIndex: "repair_count",
              key: "repair_count",
              sorter: (a, b) => a.repair_count - b.repair_count,
              render: (val) => (
                <Typography.Text type="danger" strong>
                  {translate("dashboard.fault_count", { count: val })}
                </Typography.Text>
              ),
            },
          ]}
          expandable={{
            // 确保安全解析子列表
            expandedRowRender: (record) => {
              return (
                <div
                  style={{
                    padding: "16px 24px",
                    backgroundColor: "#fafafa",
                    borderRadius: 8,
                    margin: "8px 0",
                  }}
                >
                  <Typography.Text
                    type="secondary"
                    style={{ marginBottom: 12, display: "block" }}
                  >
                    <WarningOutlined /> {translate("dashboard.model_breakdown")}
                  </Typography.Text>
                  <Table
                    dataSource={record.parsed_breakdown} // 直接使用预处理好的数据
                    rowKey="model_name"
                    size="small" // 紧凑型表格
                    pagination={{
                      pageSize: 10, // 每页只渲染 10 个机型，彻底告别卡顿
                      hideOnSinglePage: true, // 如果不到 10 个机型，自动隐藏分页器
                      showSizeChanger: false,
                    }}
                    columns={[
                      {
                        title: translate("dashboard.model_name"),
                        dataIndex: "model_name",
                        key: "model_name",
                      },
                      {
                        title: translate("dashboard.repair_count"),
                        dataIndex: "count",
                        key: "count",
                        width: 120,
                        render: (val) => (
                          <Tag color="blue">
                            {translate("dashboard.fault_count", {
                              count: val,
                            })}
                          </Tag>
                        ),
                      },
                    ]}
                  />
                </div>
              );
            },
            // 只有当解析后数组长度大于 0 时，才显示 `+` 号展开图标
            rowExpandable: (record) => record.parsed_breakdown?.length > 0,
          }}
        />
      </Modal>
    </>
  );
};
