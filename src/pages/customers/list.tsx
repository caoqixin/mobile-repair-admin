import { BaseRecord, useCan, useTranslate } from "@refinedev/core";
import {
  useTable,
  List,
  EditButton,
  ShowButton,
  DateField,
  DeleteButton,
} from "@refinedev/antd";
import { Table, Space, Form, Input, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { ListLoader } from "../../components/loadings";
export const CustomerList = () => {
  const translate = useTranslate();
  const { data: canDelete } = useCan({
    resource: "customers",
    action: "delete",
  });
  const {
    tableProps,
    setCurrentPage,
    pageCount,
    searchFormProps,
    tableQuery: { isLoading },
  } = useTable({
    syncWithLocation: true,
    onSearch: (params: any) => {
      const { q } = params;

      return [
        {
          operator: "or",
          value: [
            { field: "full_name", operator: "contains", value: q },
            { field: "phone", operator: "contains", value: q },
          ],
        },
      ];
    },
  });

  if (isLoading) {
    return <ListLoader />;
  }

  return (
    <List>
      {/* 搜索栏 */}
      <Form {...searchFormProps} layout="inline" style={{ marginBottom: 20 }}>
        <Form.Item name="q">
          <Input
            placeholder="搜索手机号码/用户名..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            allowClear
            onClear={searchFormProps.form?.submit}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={searchFormProps.form?.submit}>
            查询
          </Button>
        </Form.Item>
      </Form>

      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="full_name"
          title={translate("customers.fields.full_name")}
        />
        <Table.Column
          dataIndex="phone"
          title={translate("customers.fields.phone")}
        />
        <Table.Column
          dataIndex="notes"
          title={translate("customers.fields.notes")}
        />
        <Table.Column
          dataIndex={["created_at"]}
          title={translate("customers.fields.created_at")}
          render={(value: any) => <DateField value={value} />}
        />
        <Table.Column
          title={translate("table.actions")}
          dataIndex="actions"
          render={(_, record: BaseRecord) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
              <EditButton hideText size="small" recordItemId={record.id} />
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
