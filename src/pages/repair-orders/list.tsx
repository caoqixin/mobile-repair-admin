import {
  List,
  useTable,
  ShowButton,
  EditButton,
  DateField,
} from "@refinedev/antd";
import { Table, Tag, Space, Typography, Input, Form, Tabs } from "antd";
import {
  ToolOutlined,
  UserOutlined,
  MobileOutlined,
  SearchOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { REPAIR_STATUS_OPTIONS } from "../../constants";

const { Text } = Typography;

export const RepairOrderList = () => {
  // 定义当前选中的 Tab
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  const { tableProps, searchFormProps } = useTable({
    syncWithLocation: true,
    meta: {
      select: "*, customers(full_name, phone), models(name)", // 关联查询
    },
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
    filters: {
      permanent: [
        // 1. [进行中 Tab] 逻辑:
        // 排除已完成 (Completed)
        {
          field: "status",
          operator: "ne", // neq = Not Equal
          value: activeTab === "active" ? "completed" : undefined,
        },
        // 且 排除已取消 (Cancelled)
        {
          field: "status",
          operator: "ne",
          value: activeTab === "active" ? "cancelled" : undefined,
        },

        // 2. [历史 Tab] 逻辑:
        // 只看 已完成 或 已取消
        {
          field: "status",
          operator: "in", // in 操作符通常比较稳定
          value:
            activeTab === "history" ? ["completed", "cancelled"] : undefined,
        },
      ],
    },
    onSearch: (params: any) => {
      const filters: any[] = [];
      const { q } = params;
      if (q) {
        filters.push({
          operator: "or",
          value: [
            { field: "readable_id", operator: "contains", value: q },
            { field: "imei_sn", operator: "contains", value: q },
            { field: "customers.full_name", operator: "contains", value: q }, // 支持搜客户名
          ],
        });
      }
      return filters;
    },
  });

  const getStatusConfig = (status: string) => {
    return (
      REPAIR_STATUS_OPTIONS.find((o) => o.value === status) || {
        color: "default",
        label: status,
      }
    );
  };

  // Tab 切换处理
  const handleTabChange = (key: string) => {
    setActiveTab(key as "active" | "history");
    // useTable 的 filters 依赖 activeTab 状态，状态变了会自动刷新
  };

  return (
    <List>
      <Tabs
        defaultActiveKey="active"
        activeKey={activeTab}
        onChange={handleTabChange}
        type="card"
        items={[
          {
            label: (
              <span>
                <ThunderboltOutlined /> 进行中 (Active)
              </span>
            ),
            key: "active",
          },
          {
            label: (
              <span>
                <HistoryOutlined /> 历史记录 (History)
              </span>
            ),
            key: "history",
          },
        ]}
      />

      {/* 搜索栏 */}
      <Form {...searchFormProps} layout="inline" style={{ marginBottom: 20 }}>
        <Form.Item name="q">
          <Input
            placeholder="搜索单号 / IMEI / 客户名..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
          />
        </Form.Item>
        <Form.Item>
          <button type="submit" style={{ display: "none" }} />
        </Form.Item>
      </Form>

      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="readable_id"
          title="维修单号 (ID)"
          render={(val) => <b>{val || "---"}</b>}
        />

        <Table.Column
          title="设备信息 (Dispositivo)"
          render={(_, record: any) => (
            <Space direction="vertical" size={0}>
              <Text strong>
                <MobileOutlined /> {record.models?.name || "Unknown"}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.imei_sn}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.problem_description}
              </Text>
            </Space>
          )}
        />

        <Table.Column
          title="客户 (Cliente)"
          render={(_, record: any) => (
            <Space direction="vertical">
              <Text strong>
                <UserOutlined /> {record.customers?.full_name}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.customers?.phone}
              </Text>
            </Space>
          )}
        />

        <Table.Column
          dataIndex="status"
          title="状态 (Stato)"
          render={(val) => {
            const conf = getStatusConfig(val);
            return <Tag color={conf.color}>{conf.label}</Tag>;
          }}
        />
        <Table.Column
          title="费用"
          dataIndex="total_price"
          render={(val) =>
            val === 0 ? (
              <Tag color="green">保修/免费</Tag>
            ) : (
              `€ ${Number(val).toFixed(2)}`
            )
          }
        />

        <Table.Column
          dataIndex="created_at"
          title="接单时间"
          render={(val) => <DateField value={val} format="MM-DD HH:mm" />}
        />

        <Table.Column
          title="操作"
          render={(_, record: any) => (
            <Space>
              {record.status != "completed" && (
                <EditButton hideText size="small" recordItemId={record.id} />
              )}
              <ShowButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
