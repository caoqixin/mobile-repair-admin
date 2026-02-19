import { BaseRecord, useTranslate } from "@refinedev/core";
import {
  useTable,
  List,
  EditButton,
  UrlField,
  DateField,
  DeleteButton,
  TagField,
} from "@refinedev/antd";
import { Table, Space } from "antd";
import { ListLoader } from "../../components/loadings";

export const SupplierList = () => {
  const translate = useTranslate();
  const {
    tableProps,
    setCurrentPage,
    pageCount,
    tableQuery: { isLoading },
  } = useTable({
    syncWithLocation: true,
  });

  if (isLoading) {
    return <ListLoader />;
  }

  return (
    <List title={translate("suppliers.titles.list")}>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="name"
          title={translate("suppliers.fields.name")}
        />
        <Table.Column
          dataIndex={["website"]}
          title={translate("suppliers.fields.website")}
          render={(value: any) => <UrlField value={value} />}
        />
        <Table.Column
          dataIndex="description"
          title={translate("suppliers.fields.description")}
          render={(value: string) =>
            value && value.split(",").map((tag) => <TagField value={tag} />)
          }
        />
        <Table.Column
          dataIndex={["created_at"]}
          title={translate("suppliers.fields.created_at")}
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
