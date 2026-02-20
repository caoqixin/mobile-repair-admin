import {
  DateField,
  EditButton,
  List,
  ShowButton,
  TagField,
  useTable,
} from "@refinedev/antd";
import { Space, Table } from "antd";
import { formatCurrency, getStatusColor } from "../../lib/utils";
import { useTranslate } from "@refinedev/core";
import { ListLoader } from "../../components/loadings";
import { useMemo } from "react";
import { PURCHASE_STATUS_OPTIONS } from "../../constants";

export const PurchaseOrderList = () => {
  const translate = useTranslate();
  const {
    tableProps,
    tableQuery: { isLoading },
  } = useTable({
    syncWithLocation: true,
    meta: {
      select: "*, suppliers(id, name), profiles(full_name)", // 关联查询供应商和创建人
    },
    sorters: {
      permanent: [
        {
          field: "readable_id",
          order: "desc",
        },
      ],
    },
  });

  const statusOptions = useMemo(
    () =>
      PURCHASE_STATUS_OPTIONS.map((o) => ({
        ...o,
        label: translate(o.label),
      })),
    [PURCHASE_STATUS_OPTIONS],
  );

  if (isLoading) {
    return <ListLoader />;
  }

  return (
    <List title={translate("purchase_orders.titles.list")}>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="readable_id"
          title={translate("purchase_orders.fields.readable_id")}
          render={(value) => <b>#{value}</b>}
        />
        <Table.Column
          dataIndex={["suppliers", "name"]}
          title={translate("purchase_orders.fields.supplier")}
        />
        <Table.Column
          dataIndex="status"
          title={translate("purchase_orders.fields.status")}
          render={(value) => (
            <TagField
              color={getStatusColor(value)}
              value={statusOptions.find((o) => o.value === value)?.label}
            />
          )}
        />
        <Table.Column
          dataIndex="total_estimated_cost"
          title={translate("purchase_orders.fields.total_estimated_cost")}
          render={(value) => formatCurrency(value)}
        />
        <Table.Column
          dataIndex="expected_arrival_date"
          title={translate("purchase_orders.fields.expected_arrival_date")}
          render={(value) => <DateField value={value} format="YYYY-MM-DD" />}
        />
        <Table.Column
          title={translate("table.actions")}
          render={(_, record: any) => (
            <Space>
              {record.status !== "received" &&
                record.status !== "cancelled" && (
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
