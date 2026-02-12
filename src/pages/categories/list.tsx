import { BaseRecord, useCan, useTranslate } from "@refinedev/core";
import {
  useTable,
  List,
  EditButton,
  DateField,
  DeleteButton,
  TagField,
} from "@refinedev/antd";
import { Table, Space } from "antd";
import { CategoryType, ICategory } from "../../interface";
import { CATEGORY_TYPE_MAP } from "../../constants";
import { ListLoader } from "../../components/loadings";

export const CategoryList = () => {
  const { data: canCreate } = useCan({
    resource: "categories",
    action: "create",
  });
  const { data: canEdit } = useCan({
    resource: "categories",
    action: "create",
  });
  const { data: canDelete } = useCan({
    resource: "categories",
    action: "create",
  });
  const translate = useTranslate();
  const {
    tableProps,
    setCurrentPage,
    pageCount,
    tableQuery: { isLoading },
  } = useTable<ICategory>({
    syncWithLocation: true,
  });

  if (isLoading) {
    return <ListLoader />;
  }

  return (
    <List canCreate={canCreate?.can}>
      <Table
        {...tableProps}
        pagination={{
          ...tableProps.pagination,
          position: ["bottomRight"],
          size: "small",
        }}
        rowKey="id"
      >
        <Table.Column
          dataIndex="name"
          title={translate("categories.fields.name")}
        />
        <Table.Column
          dataIndex="type"
          title={translate("categories.fields.type")}
          render={(value: CategoryType) => (
            <TagField
              value={CATEGORY_TYPE_MAP[value]}
              color={value === "component" ? "blue" : "yellow"}
            />
          )}
        />
        <Table.Column
          dataIndex={["created_at"]}
          title={translate("categories.fields.created_at")}
          render={(value: any) => <DateField value={value} />}
        />
        <Table.Column
          title={translate("table.actions")}
          dataIndex="actions"
          render={(_, record: BaseRecord) => (
            <Space>
              {canEdit?.can && (
                <EditButton hideText size="small" recordItemId={record.id} />
              )}
              {canDelete?.can && (
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
              )}
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
