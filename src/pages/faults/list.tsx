import { BaseRecord, useTranslate } from "@refinedev/core";
import {
  useTable,
  List,
  EditButton,
  DateField,
  DeleteButton,
} from "@refinedev/antd";
import { Table, Space } from "antd";
import { IFault } from "../../interface";

export const FaultList = () => {
  const translate = useTranslate();
  const { tableProps, setCurrentPage, pageCount } = useTable<IFault>({
    syncWithLocation: true,
  });

  return (
    <List>
      <Table
        {...tableProps}
        pagination={{
          ...tableProps.pagination,
          position: ["bottomRight"],
          size: "small",
        }}
        rowKey="id"
      >
        <Table.Column dataIndex="id" title={translate("faults.fields.id")} />
        <Table.Column
          dataIndex="name"
          title={translate("faults.fields.name")}
        />
        <Table.Column
          dataIndex="description"
          title={translate("faults.fields.description")}
        />
        <Table.Column
          dataIndex={["created_at"]}
          title={translate("faults.fields.created_at")}
          render={(value: any) => <DateField value={value} />}
        />
        <Table.Column
          title={translate("table.actions")}
          dataIndex="actions"
          render={(_, record: BaseRecord) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton
                hideText
                size="small"
                recordItemId={record.id}
                onSuccess={() => {
                  if (tableProps.dataSource?.length! <= 1) {
                    setCurrentPage(pageCount - 1);
                  }
                }}
              />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
