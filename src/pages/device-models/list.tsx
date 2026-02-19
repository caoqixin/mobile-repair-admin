import {
  List,
  useTable,
  EditButton,
  DeleteButton,
  ShowButton,
  CreateButton,
} from "@refinedev/antd";
import { Button, Card, Form, Input, Space, Table } from "antd";
import { BaseRecord, HttpError, useCan, useTranslate } from "@refinedev/core";
import { IBrand } from "../../interface";
import { SearchOutlined } from "@ant-design/icons";
import { ListLoader } from "../../components/loadings";
export const DeviceModelList = () => {
  const translate = useTranslate();

  const { data: canCreate } = useCan({
    resource: "device_models",
    action: "create",
  });
  const { data: canEdit } = useCan({
    resource: "device_models",
    action: "create",
  });
  const { data: canDelete } = useCan({
    resource: "device_models",
    action: "create",
  });

  const {
    tableProps,
    searchFormProps,
    pageCount,
    setCurrentPage,
    tableQuery: { isLoading },
  } = useTable<IBrand, HttpError, { name: string }>({
    syncWithLocation: true,
    resource: "brands",
    sorters: {
      initial: [
        {
          field: "name",
          order: "asc",
        },
      ],
    },
    onSearch: (values) => {
      const { name } = values;

      return [
        {
          field: "name",
          operator: "contains", // Supabase 中对应 ilike %value%
          value: name,
        },
      ];
    },
  });

  if (isLoading) {
    return <ListLoader />;
  }

  return (
    <List
      resource="brands"
      title={translate("brands.titles.brandList")}
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          {canCreate?.can && <CreateButton />}
        </>
      )}
    >
      <Card variant="borderless" style={{ marginBottom: "10px" }}>
        <Form
          {...searchFormProps}
          layout="inline"
          style={{
            display: "flex",
            gap: "5px",
          }}
        >
          <Form.Item name="name" noStyle>
            <Input
              placeholder={translate("filters.brands.placeholder")}
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              allowClear // 允许点击 X 清空，清空后会自动重置表格
              onClear={searchFormProps.form?.submit}
            />
          </Form.Item>
          <Form.Item noStyle>
            <Button
              icon={<SearchOutlined />}
              type="primary"
              onClick={searchFormProps.form?.submit}
            />
          </Form.Item>
        </Form>
      </Card>
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
          sorter
          title={translate("brands.fields.name")}
        />

        <Table.Column
          title={translate("table.actions")}
          dataIndex="actions"
          render={(_, record: BaseRecord) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
              {canEdit?.can && (
                <EditButton hideText size="small" recordItemId={record.id} />
              )}
              {canDelete?.can && (
                <DeleteButton
                  hideText
                  size="small"
                  resource="brands"
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
