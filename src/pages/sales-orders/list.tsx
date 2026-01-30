import React from "react";
import {
  List,
  useTable,
  ShowButton,
  DateField,
  NumberField,
} from "@refinedev/antd";
import { Table, Tag, Space, Typography, Avatar } from "antd";

const { Text } = Typography;

export const SalesOrderList = () => {
  const { tableProps } = useTable({
    syncWithLocation: true,
    meta: {
      // 关联查询：客户信息、销售员信息
      select: "*, profiles(full_name)",
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
  const getPaymentTag = (method: string) => {
    const map: any = {
      cash: { color: "green", icon: "💶" },
      card: { color: "blue", icon: "💳" },
      transfer: { color: "purple", icon: "🏦" },
    };
    const conf = map[method] || { color: "default", icon: "" };
    return (
      <Tag color={conf.color}>
        {conf.icon} {method.toUpperCase()}
      </Tag>
    );
  };

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="readable_id"
          title="订单号 (ID)"
          render={(val) => <b>{val || "---"}</b>}
        />

        <Table.Column
          dataIndex="total_amount"
          title="金额 (Totale)"
          render={(val) => (
            <Text strong style={{ color: "#3f8600" }}>
              € {Number(val).toFixed(2)}
            </Text>
          )}
        />

        <Table.Column
          dataIndex="payment_method"
          title="支付方式"
          render={(val) => getPaymentTag(val)}
        />

        <Table.Column
          title="销售员"
          render={(_, record: any) => record.profiles?.full_name}
        />

        <Table.Column
          dataIndex="created_at"
          title="时间"
          render={(val) => <DateField value={val} format="MM-DD HH:mm" />}
        />

        <Table.Column
          title="操作"
          render={(_, record: any) => (
            <ShowButton hideText size="small" recordItemId={record.id} />
          )}
        />
      </Table>
    </List>
  );
};
