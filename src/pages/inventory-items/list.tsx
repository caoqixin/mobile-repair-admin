import {
  List,
  useTable,
  useSelect,
  EditButton,
  ShowButton,
  CreateButton,
  DeleteButton,
  NumberField,
} from "@refinedev/antd";
import {
  Table,
  Form,
  Input,
  Select,
  Card,
  Space,
  Tag,
  Row,
  Col,
  Button,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useTranslate, CrudFilters, HttpError } from "@refinedev/core";
import { IInventoryItem } from "../../interface";

export const InventoryItemsList = () => {
  const translate = useTranslate();

  const { tableProps, searchFormProps } = useTable<
    IInventoryItem,
    HttpError,
    { q: string; category_id: number }
  >({
    syncWithLocation: true,
    resource: "inventory_items",
    meta: {
      select: "*, categories(id, name)",
    },
    onSearch: (params) => {
      const { q, category_id } = params;

      return [
        {
          operator: "or",
          value: [
            { field: "name", operator: "contains", value: q },
            { field: "sku", operator: "contains", value: q },
          ],
        },
        {
          field: "category_id",
          operator: "eq",
          value: category_id,
        },
      ];
    },
  });

  const { selectProps: categorySelectProps } = useSelect({
    resource: "categories",
    // 过滤出 'item' (商品) 类型的分类
    filters: [{ field: "type", operator: "eq", value: "item" }],
    optionLabel: "name",
    optionValue: "id",
  });

  return (
    <List>
      <Card variant="borderless" styles={{ body: { padding: "24px" } }}>
        <Form
          {...searchFormProps}
          layout="vertical"
          initialValues={{ q: "", category_id: null }}
        >
          <Row gutter={16} align="bottom">
            <Col span={8}>
              <Form.Item label="搜索商品" name="q">
                <Input
                  placeholder="输入名称或 SKU..."
                  prefix={<SearchOutlined />}
                  allowClear
                  onClear={searchFormProps.form?.submit}
                  onPressEnter={searchFormProps.form?.submit}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={translate("inventory_items.fields.category")}
                name="category_id"
              >
                <Select
                  {...categorySelectProps}
                  allowClear
                  placeholder="全部分类"
                  onClear={searchFormProps.form?.submit}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={searchFormProps.form?.submit}
                >
                  查询
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="sku"
          title={translate("inventory_items.fields.sku")}
          width={120}
        />
        <Table.Column
          dataIndex="name"
          title={translate("inventory_items.fields.name")}
        />
        <Table.Column
          dataIndex={["categories", "name"]}
          title={translate("inventory_items.fields.category")}
          render={(val) => (val ? <Tag color="cyan">{val}</Tag> : "-")}
        />
        <Table.Column
          dataIndex="stock_quantity"
          title={translate("inventory_items.fields.stock")}
          render={(val) => (
            <Tag color={val > 5 ? "green" : val > 0 ? "orange" : "red"}>
              {val}
            </Tag>
          )}
          sorter
        />
        <Table.Column
          dataIndex="retail_price"
          title={translate("inventory_items.fields.retail_price")}
          align="right"
          render={(val) => (
            <NumberField
              value={val}
              options={{ style: "currency", currency: "EUR" }}
            />
          )}
          sorter
        />
        <Table.Column
          title={translate("table.actions")}
          dataIndex="actions"
          render={(_, record: any) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
