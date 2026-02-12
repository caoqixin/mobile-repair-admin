import { List, useTable, ShowButton, DateField } from "@refinedev/antd";
import { Table, Tag, Space, Input, Form, Button } from "antd";
import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import { IStockEntry } from "../../interface";
import { HttpError } from "@refinedev/core";
import { ListLoader } from "../../components/loadings";
import { getTypeTag } from "../../lib/utils";

export const StockEntriesList = () => {
  const {
    tableProps,
    searchFormProps,
    tableQuery: { isLoading },
  } = useTable<IStockEntry, HttpError, { q: string }>({
    syncWithLocation: true,
    meta: {
      // 关联查询操作人姓名
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
    onSearch: (params) => {
      const { q } = params;

      return [
        {
          field: "reference_number",
          operator: "contains",
          value: q,
        },
      ];
    },
  });

  if (isLoading) {
    return <ListLoader />;
  }

  return (
    <List>
      {/* 简单的搜索栏 */}
      <Form {...searchFormProps} layout="inline" style={{ marginBottom: 20 }}>
        <Form.Item name="q">
          <Input
            placeholder="搜索单号 (如 PO-2026...)"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={searchFormProps.form?.submit}
          >
            查询
          </Button>
        </Form.Item>
      </Form>

      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="reference_number"
          title="关联单号 (Riferimento)"
          render={(val) => <b>{val || "---"}</b>}
        />

        <Table.Column
          dataIndex="type"
          title="类型 (Tipo)"
          render={(val) => {
            const tag = getTypeTag(val);
            return <Tag color={tag.color}>{tag.label}</Tag>;
          }}
        />

        <Table.Column
          title="操作人 (Operatore)"
          render={(_, record: any) => (
            <Space>
              <UserOutlined />
              <Space direction="vertical">
                {record.profiles?.full_name} {record.profiles?.email}
              </Space>
            </Space>
          )}
        />

        <Table.Column
          dataIndex="created_at"
          title="入库时间 (Data)"
          render={(value) => (
            <DateField value={value} format="YYYY-MM-DD HH:mm" />
          )}
        />

        <Table.Column
          title="操作"
          render={(_, record: any) => (
            // ⚠️ 严禁删除，只提供查看功能
            <ShowButton hideText size="small" recordItemId={record.id} />
          )}
        />
      </Table>
    </List>
  );
};
