import { useShow } from "@refinedev/core";
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

const { Text } = Typography;

export const StockEntriesShow = () => {
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
      title={`入库单详情 #${record?.reference_number || record?.id}`}
    >
      <Card variant="borderless" className="shadow-sm">
        <Descriptions
          title="单据信息"
          bordered
          column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label="关联单号">
            <Space>
              <ImportOutlined />
              <Text strong>{record?.reference_number}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="入库类型">
            <Tag color="blue">{record?.type?.toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="操作人">
            {record?.profiles?.full_name} {record?.profiles?.email}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            <DateField value={record?.created_at} format="DD/MM/YYYY" />
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">
          <FileTextOutlined /> 入库明细列表
        </Divider>

        <Table
          dataSource={record?.stock_entry_items}
          rowKey="id"
          pagination={false}
          size="small"
        >
          <Table.Column
            title="类型"
            render={(_, item: any) =>
              item.component_id ? (
                <Tag icon={<ToolOutlined />}>配件</Tag>
              ) : (
                <Tag icon={<ShoppingCartOutlined />}>商品</Tag>
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
            title="产品名称"
            render={(_, item: any) => (
              <b>
                {item.inventory_components?.name ||
                  item.inventory_items?.name ||
                  "未知商品"}
              </b>
            )}
          />
          <Table.Column
            title="入库数量"
            dataIndex="quantity"
            render={(v) => <b style={{ color: "#52c41a" }}>+{v}</b>}
          />
          <Table.Column
            title="入库成本"
            dataIndex="cost_price"
            render={(v) => `€ ${Number(v).toFixed(2)}`}
          />
        </Table>
      </Card>
    </Show>
  );
};
