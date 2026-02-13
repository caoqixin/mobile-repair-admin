import { useShow } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import { Typography, Card, Divider, Table, Row, Col, Tag, Button } from "antd";
import { PrinterOutlined, ShopOutlined } from "@ant-design/icons";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

const { Title, Text } = Typography;

export const SalesOrderShow = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });
  const { query } = useShow({
    meta: {
      select: "*, sales_order_items(*, inventory_items(name, sku))",
    },
  });
  const { data, isLoading } = query;
  const record = data?.data;

  return (
    <Show
      isLoading={isLoading}
      title="订单详情"
      // 添加打印按钮（逻辑需额外实现，这里仅做UI）
      headerButtons={({ defaultButtons }) => (
        <>
          <Button type="dashed" onClick={reactToPrintFn}>
            <PrinterOutlined /> 打印小票
          </Button>
          {defaultButtons}
        </>
      )}
    >
      <div ref={contentRef} style={{ maxWidth: 800, margin: "0 auto" }}>
        <Card
          variant="borderless"
          className="invoice-box"
          style={{ padding: 24 }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Title level={3} style={{ marginBottom: 0 }}>
              <ShopOutlined /> {import.meta.env.VITE_APP_STORE_NAME}
            </Title>
            <Text type="secondary">
              {import.meta.env.VITE_APP_STORE_ADDRESS}
            </Text>
            <br />
            <Text type="secondary">
              Tel: {import.meta.env.VITE_APP_STORE_TEL}
            </Text>
          </div>

          {/* Order Info */}
          <Row gutter={24} style={{ marginBottom: 24 }}>
            <Col span={12} style={{ textAlign: "right" }}>
              <Text type="secondary">单号 (Ordine #): </Text>
              <Text strong>{record?.readable_id}</Text>
              <br />
              <Text type="secondary">
                {new Date(record?.created_at).toLocaleString()}
              </Text>
            </Col>
          </Row>

          {/* Items Table */}
          <Table
            dataSource={record?.sales_order_items}
            rowKey="id"
            pagination={false}
            size="small"
            bordered={false}
          >
            <Table.Column
              title="商品 (Prodotto)"
              render={(_, item: any) => (
                <div>
                  <Text>{item.inventory_items?.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.inventory_items?.sku}
                  </Text>
                </div>
              )}
            />
            <Table.Column
              title="数量"
              dataIndex="quantity"
              align="center"
              render={(val) => `x${val}`}
            />
            <Table.Column
              title="单价"
              dataIndex="unit_price"
              align="right"
              render={(val) => `€ ${Number(val).toFixed(2)}`}
            />
            <Table.Column
              title="小计"
              align="right"
              render={(_, item: any) => (
                <Text strong>
                  € {(item.quantity * item.unit_price).toFixed(2)}
                </Text>
              )}
            />
          </Table>

          <Divider />

          {/* Total */}
          <Row justify="end">
            <Col span={12}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text>支付方式 (Pagamento):</Text>
                <Tag>{record?.payment_method?.toUpperCase()}</Tag>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 18,
                }}
              >
                <Text strong>总计 (TOTALE):</Text>
                <Text strong style={{ color: "#3f8600" }}>
                  € {Number(record?.total_amount).toFixed(2)}
                </Text>
              </div>
            </Col>
          </Row>

          {/* Footer */}
          <div
            style={{
              textAlign: "center",
              marginTop: 40,
              borderTop: "1px dashed #e8e8e8",
              paddingTop: 20,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              谢谢惠顾! Grazie per il vostro acquisto!
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              保修期内请保留此凭证
            </Text>
          </div>
        </Card>
      </div>
    </Show>
  );
};
