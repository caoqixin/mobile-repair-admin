import React from "react";
import { List, useTable, ShowButton, DateField } from "@refinedev/antd";
import { Table, Tag, Space, Typography, Progress, Tooltip } from "antd";
import {
  SafetyCertificateOutlined,
  UserOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

export const WarrantyList = () => {
  const { tableProps } = useTable({
    syncWithLocation: true,
    meta: {
      // 关联查询：维修单号、客户姓名
      select: "*, repair_orders(readable_id), customers(full_name)",
      orderBy: { created_at: "desc" },
    },
  });

  // 计算剩余天数百分比 (用于进度条)
  const calculateProgress = (start: string, end: string) => {
    const total = dayjs(end).diff(dayjs(start), "day");
    const passed = dayjs().diff(dayjs(start), "day");
    const percent = Math.max(0, Math.min(100, (passed / total) * 100));
    return percent;
  };

  // 状态颜色映射
  const getStatusTag = (status: string) => {
    const map: any = {
      active: { color: "success", label: "生效中 (Active)" },
      expired: { color: "default", label: "已过期 (Expired)" },
      void: { color: "error", label: "作废 (Void)" },
    };
    const conf = map[status] || { color: "default", label: status };
    return <Tag color={conf.color}>{conf.label}</Tag>;
  };

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="readable_id"
          title="保修单号 (ID)"
          render={(val) => <b>{val || "---"}</b>}
        />

        <Table.Column
          title="关联维修单 (Riparazione)"
          render={(_, record: any) => (
            <Tag icon={<ToolOutlined />}>
              {record.repair_orders?.readable_id || "---"}
            </Tag>
          )}
        />

        <Table.Column
          title="客户 (Cliente)"
          render={(_, record: any) => (
            <Space>
              <UserOutlined />
              {record.customers?.full_name}
            </Space>
          )}
        />

        <Table.Column
          dataIndex="status"
          title="状态"
          render={(val) => getStatusTag(val)}
        />

        <Table.Column
          title="保修期限 (Scadenza)"
          width={200}
          render={(_, record: any) => {
            const percent = calculateProgress(
              record.start_date,
              record.end_date,
            );
            const isExpired = dayjs().isAfter(dayjs(record.end_date));

            return (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                  }}
                >
                  <DateField value={record.start_date} format="MM/DD" />
                  <Text type="secondary">→</Text>
                  <DateField value={record.end_date} format="MM/DD" />
                </div>
                <Tooltip
                  title={isExpired ? "已过期" : `有效期至 ${record.end_date}`}
                >
                  <Progress
                    percent={percent}
                    showInfo={false}
                    size="small"
                    status={isExpired ? "exception" : "active"}
                    strokeColor={isExpired ? "#d9d9d9" : "#52c41a"}
                  />
                </Tooltip>
              </div>
            );
          }}
        />

        <Table.Column
          title="售后记录"
          dataIndex="claim_count"
          align="center"
          render={(val) =>
            val > 0 ? (
              <Tag color="orange" icon={<HistoryOutlined />}>
                {val} 次
              </Tag>
            ) : (
              <Text type="secondary">-</Text>
            )
          }
        />

        <Table.Column
          title="查看"
          render={(_, record: any) => (
            <ShowButton hideText size="small" recordItemId={record.id} />
          )}
        />
      </Table>
    </List>
  );
};
import { ToolOutlined } from "@ant-design/icons";
