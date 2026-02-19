import { useShow, useTranslate } from "@refinedev/core";
import { Show, DateField } from "@refinedev/antd";
import {
  Descriptions,
  Table,
  Tag,
  Typography,
  Card,
  Space,
  Divider,
} from "antd";
import {
  ImportOutlined,
  ToolOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { formatCurrency } from "../../lib/utils";

const { Text } = Typography;

export const StockEntriesShow = () => {
  const translate = useTranslate();
  const { query } = useShow({
    resource: "stock_entries",
    meta: {
      // 深度嵌套查询：查出主表 + 用户 + 子表 + 子表关联的配件/商品详情
      select:
        "*, profiles(full_name, email), stock_entry_items(*, inventory_components(sku, name), inventory_items(sku, name))",
    },
  });
  const { data, isLoading } = query;
  const record = data?.data;

  return (
    <Show
      isLoading={isLoading}
      title={translate("stock_entries.titles.show", {
        id: record?.reference_number,
      })}
    >
      <Card variant="borderless" className="shadow-sm">
        <Descriptions
          title={translate("stock_entries.titles.detail")}
          bordered
          column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        >
          <Descriptions.Item
            label={translate("stock_entries.fields.reference_number")}
          >
            <Space>
              <ImportOutlined />
              <Text strong>{record?.reference_number}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={translate("stock_entries.fields.type")}>
            <Tag color="blue">{record?.type?.toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={translate("stock_entries.fields.operator")}>
            {record?.profiles?.full_name} {record?.profiles?.email}
          </Descriptions.Item>
          <Descriptions.Item
            label={translate("stock_entries.fields.created_at")}
          >
            <DateField value={record?.created_at} format="DD/MM/YYYY" />
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">
          <FileTextOutlined /> {translate("stock_entries.detail.title")}
        </Divider>

        <Table
          dataSource={record?.stock_entry_items}
          rowKey="id"
          pagination={false}
          size="small"
        >
          <Table.Column
            title={translate("stock_entries.fields.type")}
            render={(_, item: any) =>
              item.component_id ? (
                <Tag icon={<ToolOutlined />}>
                  {translate("stock_entries.detail.buttons.tool")}
                </Tag>
              ) : (
                <Tag icon={<ShoppingCartOutlined />}>
                  {translate("stock_entries.detail.buttons.shop")}
                </Tag>
              )
            }
          />
          <Table.Column
            title="SKU"
            render={(_, item: any) =>
              item.inventory_components?.sku || item.inventory_items?.sku || "-"
            }
          />
          <Table.Column
            title={translate("stock_entries.detail.fields.name")}
            render={(_, item: any) => (
              <b>
                {item.inventory_components?.name ||
                  item.inventory_items?.name ||
                  translate("stock_entries.detail.fields.unkown")}
              </b>
            )}
          />
          <Table.Column
            title={translate("stock_entries.detail.fields.quantity")}
            dataIndex="quantity"
            render={(v) => <b style={{ color: "#52c41a" }}>+{v}</b>}
          />
          <Table.Column
            title={translate("stock_entries.detail.fields.cost_price")}
            dataIndex="cost_price"
            render={(v) => formatCurrency(v)}
          />
        </Table>
      </Card>
    </Show>
  );
};
