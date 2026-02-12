import { useShow, useTranslate, useUpdate } from "@refinedev/core";
import { Show, DateField } from "@refinedev/antd";
import {
  Typography,
  Descriptions,
  Table,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Divider,
  Space,
  Alert,
  Popconfirm,
  Button,
} from "antd";
import {
  ShoppingCartOutlined,
  ToolOutlined,
  ShopOutlined,
  CalendarOutlined,
  EuroCircleOutlined,
  FileTextOutlined,
  LockOutlined,
  ImportOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export const PurchaseOrderShow = () => {
  const translate = useTranslate();
  const { query } = useShow({
    resource: "purchase_orders",
    meta: {
      // 联表查询：供应商名称，以及 items 下的配件详情
      select:
        "*, suppliers(name), profiles(full_name), purchase_order_items(*, inventory_components(sku, name), inventory_items(sku, name))",
    },
  });

  const { mutate: updateStatus, mutation } = useUpdate();

  const { data, isLoading } = query;
  const record = data?.data;

  // 处理确认收货
  const handleConfirmReceipt = () => {
    updateStatus({
      resource: "purchase_orders",
      id: record?.id,
      values: {
        status: "received", // 只需更改状态，后端触发器会处理库存和价格
      },
      successNotification: {
        message: "入库成功 (Successo)",
        description: "库存已增加，最新进价已更新，订单已锁定。",
        type: "success",
      },
      errorNotification: {
        message: "操作失败",
        description: "请检查网络或权限",
        type: "error",
      },
    });
  };

  // 判断是否已入库锁定
  const isReceived = record?.status === "received";

  // 状态颜色映射
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "default";
      case "ordered":
        return "processing";
      case "received":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Show
      isLoading={isLoading}
      title={`进货单详情 #${record?.readable_id || record?.id}`}
      canEdit={!isReceived}
    >
      {/* 顶部状态栏 */}
      {/* 顶部状态与操作区 */}
      <Card
        variant="borderless"
        style={{ marginBottom: 24 }}
        styles={{ body: { padding: 16 } }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="middle">
              <Title level={4} style={{ margin: 0 }}>
                <ShopOutlined /> {record?.suppliers?.name}
              </Title>
              <Tag
                color={getStatusColor(record?.status)}
                style={{ fontSize: 14, padding: "4px 10px" }}
              >
                {record?.status?.toUpperCase()}
              </Tag>
            </Space>
          </Col>
          <Col>
            {/* 核心操作区 */}
            {isReceived ? (
              <Alert
                message="订单已入库锁定 (Bloccato)"
                type="success"
                showIcon
                icon={<LockOutlined />}
                style={{ padding: "4px 12px" }}
              />
            ) : (
              <Space>
                {/* 只有状态为 'ordered' 时才允许确认收货，草稿状态需要先去编辑页改为 ordered */}
                {record?.status === "ordered" && (
                  <Popconfirm
                    title="确认收货并入库?"
                    description="此操作将自动增加库存并更新进价，且不可撤销。"
                    onConfirm={handleConfirmReceipt}
                    okText="确认入库"
                    cancelText="取消"
                    okButtonProps={{ loading: mutation.isPending }}
                  >
                    <Button
                      type="primary"
                      icon={<ImportOutlined />}
                      loading={mutation.isPending}
                    >
                      确认收货 (Conferma Ricezione)
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            )}
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* 左侧：基本信息 */}
        <Col xs={24} lg={16}>
          <Card variant="borderless" className="shadow-sm">
            <Descriptions
              bordered
              column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
            >
              <Descriptions.Item label="单号 (ID)">
                <Text copyable>{record?.readable_id || record?.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {record?.profiles?.full_name}
              </Descriptions.Item>
              <Descriptions.Item label="预计到货">
                <Space>
                  <CalendarOutlined />{" "}
                  <DateField
                    value={record?.expected_arrival_date}
                    format="DD/MM/YYYY"
                  />
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                <DateField value={record?.created_at} format="DD/MM/YYYY" />
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ marginTop: 32 }}>
              <FileTextOutlined /> 采购明细 (Items)
            </Divider>

            <Table
              dataSource={record?.purchase_order_items}
              rowKey="id"
              pagination={false}
              size="small"
            >
              <Table.Column
                title="类型"
                key="type"
                width={100}
                render={(_, item: any) =>
                  item.component_id ? (
                    <Tag icon={<ToolOutlined />} color="blue">
                      维修件
                    </Tag>
                  ) : (
                    <Tag icon={<ShoppingCartOutlined />} color="cyan">
                      商品
                    </Tag>
                  )
                }
              />
              <Table.Column
                title="SKU"
                render={(_, item: any) => (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.inventory_components?.sku ||
                      item.inventory_items?.sku ||
                      "-"}
                  </Text>
                )}
              />
              <Table.Column
                title="名称"
                render={(_, item: any) => (
                  <Space direction="vertical" size={0}>
                    <Text strong>
                      {item.inventory_components?.name ||
                        item.inventory_items?.name}
                    </Text>
                    {/* 如果有 product_name 且与原名不同，可以显示备注名 */}
                    {item.product_name &&
                      item.product_name !==
                        (item.inventory_components?.name ||
                          item.inventory_items?.name) && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          ({item.product_name})
                        </Text>
                      )}
                  </Space>
                )}
              />
              <Table.Column
                title="数量"
                dataIndex="quantity"
                align="center"
                width={80}
              />
              <Table.Column
                title="单价"
                dataIndex="unit_cost"
                align="right"
                width={100}
                render={(val) => `€ ${Number(val).toFixed(2)}`}
              />
              <Table.Column
                title="小计"
                align="right"
                width={120}
                render={(_, item: any) => (
                  <Text strong>
                    € {(item.quantity * item.unit_cost).toFixed(2)}
                  </Text>
                )}
              />
            </Table>
          </Card>
        </Col>

        {/* 右侧：财务统计 */}
        <Col xs={24} lg={8}>
          <Card
            title="💰 订单总额"
            variant="borderless"
            styles={{ header: { background: "#fafafa" } }}
          >
            <Statistic
              title="预估总成本 (Totale Stimato)"
              value={record?.total_estimated_cost}
              precision={2}
              prefix={<EuroCircleOutlined />}
              valueStyle={{
                color: isReceived ? "#52c41a" : "#faad14",
                fontWeight: "bold",
              }}
            />
            <Divider />
            {isReceived ? (
              <div style={{ textAlign: "center", color: "#52c41a" }}>
                <CheckCircleOutlined
                  style={{ fontSize: 24, marginBottom: 8 }}
                />
                <div>已完成入库</div>
              </div>
            ) : (
              <div style={{ color: "#8c8c8c" }}>
                状态: {record?.status} (需确认收货以入库)
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Show>
  );
};
