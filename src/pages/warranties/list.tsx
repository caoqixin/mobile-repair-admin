import { List, useTable, ShowButton, DateField } from "@refinedev/antd";
import {
  Table,
  Tag,
  Space,
  Typography,
  Progress,
  Tooltip,
  Form,
  Input,
  Button,
} from "antd";
import {
  UserOutlined,
  HistoryOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { ToolOutlined } from "@ant-design/icons";
import { ListLoader } from "../../components/loadings";
import { CreateReturnButton } from "../../components/buttons";
import { useTranslate } from "@refinedev/core";
import { calculateProgress } from "../../lib/utils";

const { Text } = Typography;

export const WarrantyList = () => {
  const translate = useTranslate();
  const {
    tableProps,
    searchFormProps,
    tableQuery: { isLoading },
  } = useTable({
    syncWithLocation: true,
    meta: {
      // 关联查询：维修单号、客户姓名
      select:
        "*, repair_orders!warranties_repair_order_id_fkey(readable_id, model_id, imei_sn, problem_description), customers!inner(full_name, phone)",
    },
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
    onSearch: (params: any) => {
      const { q } = params;

      return [
        {
          field: "customers.phone",
          operator: "contains",
          value: q,
        },
      ];
    },
  });

  // 状态颜色映射
  const getStatusTag = (status: string) => {
    const map: any = {
      active: { color: "success", label: translate("warranty.status.active") },
      expired: {
        color: "default",
        label: translate("warranty.status.expired"),
      },
      voided: { color: "error", label: translate("warranty.status.void") },
      claimed: {
        color: "processing",
        label: translate("warranty.status.claimed"),
      },
    };
    const conf = map[status] || { color: "default", label: status };
    return <Tag color={conf.color}>{conf.label}</Tag>;
  };
  if (isLoading) {
    return <ListLoader />;
  }

  return (
    <List title={translate("warranty.titles.list")}>
      {/* 搜索栏 */}
      <Form {...searchFormProps} layout="inline" style={{ marginBottom: 20 }}>
        <Form.Item name="q">
          <Input
            placeholder={translate("filters.warranty.placeholder")}
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
            {translate("filters.warranty.submitButton")}
          </Button>
        </Form.Item>
      </Form>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="readable_id"
          title={translate("warranty.fields.readable_id")}
          render={(val) => <b>{val || "---"}</b>}
        />

        <Table.Column
          title={translate("warranty.fields.associate")}
          render={(_, record: any) => (
            <Tag icon={<ToolOutlined />}>
              {record.repair_orders?.readable_id || "---"}
            </Tag>
          )}
        />

        <Table.Column
          title={translate("warranty.fields.customer")}
          render={(_, record: any) => (
            <Space>
              <UserOutlined />
              <Space direction="vertical">
                {record.customers?.full_name}
                {record.customers?.phone}
              </Space>
            </Space>
          )}
        />

        <Table.Column
          dataIndex="status"
          title={translate("warranty.fields.status")}
          render={(val) => getStatusTag(val)}
        />

        <Table.Column
          title={translate("warranty.fields.duration")}
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
                  title={
                    isExpired
                      ? translate("warranty.status.expired")
                      : `${translate("warranty.text.until")} ${record.end_date}`
                  }
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
          title={translate("warranty.fields.claim")}
          dataIndex="claim_count"
          align="center"
          render={(val, record) =>
            val > 0 ? (
              <Space direction="vertical">
                <Tag color="orange" icon={<HistoryOutlined />}>
                  {val} {translate("warranty.text.count")}
                </Tag>
                <DateField value={record.last_claim_date} format="DD/MM/YYYY" />
              </Space>
            ) : (
              <Text type="secondary">-</Text>
            )
          }
        />

        <Table.Column
          title={translate("table.actions")}
          render={(_, record: any) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
              {record.status === "active" && (
                <CreateReturnButton record={record} />
              )}
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
