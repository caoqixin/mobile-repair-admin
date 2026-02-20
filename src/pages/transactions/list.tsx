import {
  List,
  useTable,
  DateField,
  NumberField,
  FilterDropdown,
} from "@refinedev/antd";
import { Table, Tag, Select, Typography } from "antd";
import { useTranslate, useNavigation } from "@refinedev/core";
import {
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { ITransaction } from "../../interface";
import { ListLoader } from "../../components/loadings";
import { FinancialStats } from "../../components/stats";
import { PAYMENT_OPTIONS } from "../../constants";

const { Text } = Typography;

export const TransactionsList = () => {
  const translate = useTranslate();
  const { show } = useNavigation();

  const {
    tableProps,
    tableQuery: { isLoading },
  } = useTable<ITransaction>({
    syncWithLocation: true,
    resource: "transactions",
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc", // 默认按时间倒序，看最新的账
        },
      ],
    },
    meta: {
      select:
        "*, profiles(full_name, email), repair_orders(readable_id), sales_orders(readable_id)",
    },
  });

  if (isLoading) {
    return <ListLoader />;
  }

  return (
    <List resource="transactions" title={translate("transactions.titles.list")}>
      <FinancialStats />
      <Table
        {...tableProps}
        pagination={{
          ...tableProps.pagination,
          position: ["bottomRight"],
          size: "small",
        }}
        rowKey="id"
        scroll={{ x: 1000 }}
      >
        {/* 日期列 */}
        <Table.Column
          dataIndex="created_at"
          title={translate("transactions.fields.created_at")}
          render={(value) => (
            <DateField value={value} format="YYYY-MM-DD HH:mm" />
          )}
          sorter
          width={160}
        />

        {/* 类型列 (收入/支出) */}
        <Table.Column
          dataIndex="type"
          title={translate("transactions.fields.type")}
          width={120}
          filterIcon={<SearchOutlined />}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ width: 200 }}
                placeholder="筛选类型"
                options={[
                  {
                    label: translate("transactions.options.income"),
                    value: "income",
                  },
                  {
                    label: translate("transactions.options.expense"),
                    value: "expense",
                  },
                ]}
              />
            </FilterDropdown>
          )}
          render={(value) => {
            const isIncome = value === "income";
            return (
              <Tag color={isIncome ? "success" : "error"}>
                {isIncome ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {isIncome
                  ? translate("transactions.options.income")
                  : translate("transactions.options.expense")}
              </Tag>
            );
          }}
        />

        {/* 金额列 */}
        <Table.Column
          width={120}
          dataIndex="amount"
          title={translate("transactions.fields.amount")}
          align="right"
          render={(value, record: ITransaction) => (
            <Text
              strong
              style={{
                color: record.type === "income" ? "#389e0d" : "#cf1322",
              }}
            >
              {record.type === "expense" ? "- " : "+ "}
              <NumberField
                value={value}
                options={{
                  style: "currency",
                  currency: "EUR", // 或者是 CNY
                }}
              />
            </Text>
          )}
          sorter
        />

        {/* 类别 */}
        <Table.Column
          width={120}
          dataIndex="category"
          title={translate("transactions.fields.category")}
          render={(value) => <Tag>{value}</Tag>}
        />

        {/* 支付方式 */}
        <Table.Column
          width={120}
          dataIndex="payment_method"
          title={translate("transactions.fields.payment_method")}
          render={(value) => (
            <Tag color="blue">
              {translate(
                PAYMENT_OPTIONS.find((o) => o.value === value)?.label as string,
              )}
            </Tag>
          )}
        />

        {/* 来源 (关联订单) */}
        <Table.Column
          title={translate("transactions.fields.associate")}
          render={(_, record: ITransaction) => {
            if (record.repair_order_id && record.repair_orders) {
              return (
                <a
                  onClick={() => show("repair_orders", record.repair_order_id!)}
                >
                  {translate("transactions.fields.repair")} #
                  {record.repair_orders.readable_id}
                </a>
              );
            }
            if (record.sales_order_id && record.sales_orders) {
              return (
                <a onClick={() => show("sales_orders", record.sales_order_id!)}>
                  {translate("transactions.fields.sale")} #
                  {record.sales_orders.readable_id}
                </a>
              );
            }
            return <Text type="secondary">-</Text>;
          }}
        />

        {/* 经手人 */}
        <Table.Column
          dataIndex={["profiles", "full_name"]}
          title={translate("transactions.fields.profile")}
          render={(_, record) =>
            record?.profiles?.full_name ?? record?.profiles?.email
          }
        />

        {/* 备注 */}
        <Table.Column
          dataIndex="description"
          title={translate("transactions.fields.description")}
          ellipsis
        />
      </Table>
    </List>
  );
};
