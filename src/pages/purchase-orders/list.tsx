import {
  DateField,
  EditButton,
  List,
  ShowButton,
  TagField,
  useTable,
} from "@refinedev/antd";
import { Space, Table } from "antd";
import { getStatusColor } from "../../lib/utils";
import { useTranslate } from "@refinedev/core";
import { ListLoader } from "../../components/loadings";

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

  if (isLoading) {
    return <ListLoader />;
  }

  return (
    <List>
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
              value={value.toUpperCase()}
            />
          )}
        />
        <Table.Column
          dataIndex="total_estimated_cost"
          title={translate("purchase_orders.fields.total_estimated_cost")}
          render={(value) => `€ ${Number(value).toFixed(2)}`}
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
