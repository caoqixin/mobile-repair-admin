import { List, useTable, ShowButton, DateField } from "@refinedev/antd";
import { Table, Tag, Typography } from "antd";
import { PAYMENT_MAP, PAYMENT_OPTIONS } from "../../constants";
import { PaymentMethod } from "../../interface";
import { useTranslate } from "@refinedev/core";
import { formatCurrency } from "../../lib/utils";

const { Text } = Typography;

export const SalesOrderList = () => {
  const translate = useTranslate();
  const { tableProps } = useTable({
    syncWithLocation: true,
    meta: {
      // 关联查询：客户信息、销售员信息
      select: "*, profiles(full_name,email)",
    },
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
  });

  // 支付方式颜色映射
  const getPaymentTag = (method: PaymentMethod) => {
    const conf = PAYMENT_MAP[method] || { color: "default", icon: "" };
    return (
      <Tag color={conf.color}>
        {conf.icon} {""}
        {translate(
          PAYMENT_OPTIONS.find((o) => o.value === method)?.label as string,
        )}
      </Tag>
    );
  };

  return (
    <List title={translate("sales_orders.titles.list")}>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="readable_id"
          title={translate("sales_orders.fields.readable_id")}
          render={(val) => <b>{val || "---"}</b>}
        />

        <Table.Column
          dataIndex="total_amount"
          title={translate("sales_orders.fields.total_amount")}
          render={(val) => (
            <Text strong style={{ color: "#3f8600" }}>
              {formatCurrency(val)}
            </Text>
          )}
        />

        <Table.Column
          dataIndex="payment_method"
          title={translate("sales_orders.fields.payment_method")}
          render={(val) => getPaymentTag(val)}
        />

        <Table.Column
          title={translate("sales_orders.fields.profile")}
          render={(_, record: any) =>
            record.profiles?.full_name ?? record.profiles?.email
          }
        />

        <Table.Column
          dataIndex="created_at"
          title={translate("sales_orders.fields.created_at")}
          render={(val) => <DateField value={val} format="MM/DD/YYYY HH:mm" />}
        />

        <Table.Column
          title={translate("table.actions")}
          render={(_, record: any) => (
            <ShowButton hideText size="small" recordItemId={record.id} />
          )}
        />
      </Table>
    </List>
  );
};
