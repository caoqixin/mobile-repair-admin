import {
  List,
  useTable,
  ShowButton,
  EditButton,
  DateField,
} from "@refinedev/antd";
import { Table, Tag, Space, Typography, Input, Form, Tabs, Button } from "antd";
import {
  UserOutlined,
  MobileOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { REPAIR_STATUS_OPTIONS } from "../../constants";
import { ListLoader } from "../../components/loadings";
import { useTranslate } from "@refinedev/core";
import { formatCurrency } from "../../lib/utils";

const { Text } = Typography;

type Tab = "active" | "history";

export const RepairOrderList = () => {
  const translate = useTranslate();
  // 定义当前选中的 Tab
  const [activeTab, setActiveTab] = useState<Tab>("active");

  const {
    tableProps,
    searchFormProps,
    tableQuery: { isLoading },
  } = useTable({
    syncWithLocation: true,
    meta: {
      select:
        "*, repair_orders_search_text, customers(full_name, phone), models(name)", // 关联查询
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
          value: activeTab === "active" ? "delivered" : undefined,
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
            activeTab === "history" ? ["delivered", "cancelled"] : undefined,
        },
      ],
    },
    onSearch: (params: any) => {
      const { q } = params;

      return [
        {
          field: "repair_orders_search_text", // 直接搜这个虚拟列
          operator: "contains",
          value: q,
        },
      ];
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
    searchFormProps.form?.setFieldValue("q", undefined);
    searchFormProps.form?.submit();
    setActiveTab(key as "active" | "history");
    // useTable 的 filters 依赖 activeTab 状态，状态变了会自动刷新
  };

  if (isLoading) {
    return <ListLoader />;
  }

  return (
    <List title={translate("repair_orders.titles.list")}>
      <Tabs
        defaultActiveKey="active"
        activeKey={activeTab}
        onChange={handleTabChange}
        type="card"
        items={[
          {
            label: (
              <span>
                <ThunderboltOutlined /> {translate("repair_orders.tabs.active")}
              </span>
            ),
            key: "active",
          },
          {
            label: (
              <span>
                <HistoryOutlined /> {translate("repair_orders.tabs.history")}
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
            placeholder={translate("filters.repair_orders.placeholder")}
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            allowClear
            onClear={searchFormProps.form?.submit}
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            onClick={searchFormProps.form?.submit}
            icon={<SearchOutlined />}
          >
            {translate("filters.repair_orders.submitButton")}
          </Button>
        </Form.Item>
      </Form>

      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="readable_id"
          title={translate("repair_orders.fields.readable_id")}
          render={(val) => <b>{val || "---"}</b>}
        />

        <Table.Column
          title={translate("repair_orders.fields.device")}
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
          title={translate("repair_orders.fields.customer")}
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
          title={translate("repair_orders.fields.status")}
          render={(val) => {
            const conf = getStatusConfig(val);
            return <Tag color={conf.color}>{conf.label}</Tag>;
          }}
        />
        <Table.Column
          title={translate("repair_orders.fields.total_price")}
          dataIndex="total_price"
          render={(val, record) =>
            val === 0 ? (
              <Tag color="green">
                {translate("repair_orders.fields.warranty")}
              </Tag>
            ) : (
              <Space direction="vertical">
                <Text>{formatCurrency(val)}</Text>
                {record?.status === "delivered" && (
                  <Text type="secondary">{record?.payment_method}</Text>
                )}
              </Space>
            )
          }
        />

        <Table.Column
          dataIndex="created_at"
          title={translate("repair_orders.fields.created_at")}
          render={(val) => <DateField value={val} format="MM-DD HH:mm" />}
        />

        <Table.Column
          title={translate("table.actions")}
          render={(_, record: any) => (
            <Space>
              {record.status != "delivered" && (
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
