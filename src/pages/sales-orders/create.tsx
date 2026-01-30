import React, { useState, useMemo } from "react";
import {
  useList,
  useCreate,
  useCreateMany, // 引入批量创建 Hook
  useGetIdentity,
  useNavigation,
  useTranslate,
  useInvalidate,
} from "@refinedev/core";
import { useSelect } from "@refinedev/antd";
import {
  Row,
  Col,
  Card,
  Input,
  List,
  Button,
  Avatar,
  Typography,
  Divider,
  Select,
  Radio,
  Statistic,
  Empty,
  message,
  Spin,
  Badge,
  Flex,
} from "antd";
import {
  ShoppingOutlined,
  PlusOutlined,
  MinusOutlined,
  ShoppingCartOutlined,
  UserAddOutlined,
  BarcodeOutlined,
  DeleteOutlined,
  PayCircleOutlined,
  BackwardOutlined,
} from "@ant-design/icons";
// 假设你有这个接口定义，如果没有可以用 any
import { IInventoryItem } from "../../interface";

const { Text, Title } = Typography;

export const SalesOrderCreate = () => {
  const t = useTranslate();
  const { list, create } = useNavigation();
  const { data: user } = useGetIdentity();
  const invalidate = useInvalidate();

  // 1. 创建订单主表 Hook
  const {
    mutateAsync: createOrder,
    mutation: { isPending: isCreatingOrder },
  } = useCreate();
  // 2. 批量创建订单子项 Hook
  const {
    mutateAsync: createOrderItems,
    mutation: { isPending: isCreatingItems },
  } = useCreateMany();

  // --- 状态管理 ---
  const [cart, setCart] = useState<any[]>([]); // 购物车
  const [searchTerm, setSearchTerm] = useState(""); // 搜索词
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // --- 数据获取 (商品库) ---
  const {
    query: { data: itemsDataResult, isLoading: itemsLoading },
  } = useList<IInventoryItem>({
    resource: "inventory_items",
    pagination: {
      pageSize: 12,
      mode: "server",
    },
    filters: [
      { field: "stock_quantity", operator: "gt", value: 0 }, // 只卖有货的
      {
        operator: "or",
        value: [
          { field: "name", operator: "contains", value: searchTerm },
          { field: "sku", operator: "contains", value: searchTerm },
        ],
      },
    ],
    queryOptions: {
      enabled: true,
    },
  });

  const items = itemsDataResult?.data || [];

  // --- 购物车逻辑 ---

  const addToCart = (item: IInventoryItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock_quantity) {
          message.warning("库存不足 (Stock insufficiente)!");
          return prev;
        }
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, diff: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + diff;
            // 如果数量 <= 0，过滤逻辑在下面处理，这里先不处理删除，防止误触
            if (newQty <= 0) return null;

            // 检查最大库存
            // 注意：这里需要去原始 items 列表中找最大库存，或者 trusting cart item snapshop
            // 为了简单，假设 cart item 里的 stock_quantity 是准确的（实际建议从 itemsData 对比）
            if (newQty > item.stock_quantity) {
              message.warning("达到库存上限");
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean); // 移除 null (即数量为0的)
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // 计算总价
  const totalAmount = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + Number(item.retail_price) * item.quantity,
      0,
    );
  }, [cart]);

  // --- 核心提交逻辑 ---
  const handleCheckout = async () => {
    if (cart.length === 0) return message.error("购物车是空的");
    if (!user?.id) return message.error("无法获取销售员信息");

    try {
      // 1. 创建 Sales Order 主表
      // Readable ID 由数据库触发器生成，前端无需传递
      const orderPayload = {
        seller_id: user.id,
        payment_method: paymentMethod,
        total_amount: totalAmount,
      };

      const { data: orderResponse } = await createOrder({
        resource: "sales_orders",
        values: orderPayload,
      });

      const orderId = orderResponse.id;

      // 2. 创建 Sales Order Items 子表
      const itemsPayload = cart.map((item) => ({
        sales_order_id: orderId,
        item_id: item.id,
        quantity: item.quantity,
        unit_price: item.retail_price,
      }));

      await createOrderItems({
        resource: "sales_order_items",
        values: itemsPayload,
      });

      // 3. 成功后处理
      message.success("收款成功！(Ordine Completato)");
      setCart([]); // 清空购物车
      invalidate({
        resource: "inventory_items",
        invalidates: ["all"],
      });
    } catch (error) {
      console.error(error);
      message.error("创建订单失败，请重试");
    }
  };

  const isLoading = isCreatingOrder || isCreatingItems;

  return (
    <Card
      variant="borderless"
      style={{ height: "calc(100vh - 124px)", padding: "12px" }}
    >
      <Row gutter={24} style={{ height: "100%" }}>
        {/* --- 左侧：商品货架 (Product Grid) --- */}
        <Col
          span={16}
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <Card
            variant="borderless"
            style={{ height: "100%", display: "flex", flexDirection: "column" }}
            styles={{
              body: {
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                padding: "16px",
              },
            }}
          >
            {/* 搜索栏 */}
            <Input
              size="large"
              placeholder="扫描条码或输入名称搜索..."
              prefix={<BarcodeOutlined />}
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 16 }}
              autoFocus
            />

            {/* 商品列表 */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              {itemsLoading ? (
                <Flex
                  justify="center"
                  align="center"
                  style={{ height: "100%" }}
                >
                  <Spin size="large" />
                </Flex>
              ) : (
                <List
                  grid={{
                    gutter: 16,
                    xs: 2,
                    sm: 2,
                    md: 3,
                    lg: 3,
                    xl: 4,
                    xxl: 4,
                  }}
                  dataSource={items}
                  renderItem={(item) => (
                    <List.Item>
                      <Badge.Ribbon
                        text={`库存: ${item.stock_quantity}`}
                        color={item.stock_quantity < 5 ? "red" : "green"}
                      >
                        <Card
                          hoverable
                          onClick={() => addToCart(item)}
                          size="small"
                          style={{ cursor: "pointer", overflow: "hidden" }}
                          styles={{ body: { padding: 12 } }}
                        >
                          <div
                            style={{
                              height: 80,
                              background: "#f0f2f5",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginBottom: 10,
                              borderRadius: 4,
                            }}
                          >
                            <ShoppingOutlined
                              style={{ fontSize: 28, color: "#bfbfbf" }}
                            />
                          </div>
                          <Text strong ellipsis style={{ display: "block" }}>
                            {item.name}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.sku}
                          </Text>

                          <Flex
                            justify="space-between"
                            align="center"
                            style={{ marginTop: 8 }}
                          >
                            <Text
                              strong
                              style={{ color: "#fa541c", fontSize: 16 }}
                            >
                              €{Number(item.retail_price).toFixed(2)}
                            </Text>
                            <Button
                              type="primary"
                              shape="circle"
                              size="small"
                              icon={<PlusOutlined />}
                            />
                          </Flex>
                        </Card>
                      </Badge.Ribbon>
                    </List.Item>
                  )}
                />
              )}
              {!itemsLoading && items.length === 0 && (
                <Empty description="未找到商品" style={{ marginTop: 50 }} />
              )}
            </div>
          </Card>
        </Col>

        {/* --- 右侧：收银台 (Checkout) --- */}
        <Col span={8} style={{ height: "100%" }}>
          <Card
            title={
              <Flex align="center" justify="space-between" gap="small">
                <Title level={5}>
                  <ShoppingCartOutlined /> <span>当前订单 (Current Order)</span>
                </Title>

                <Button
                  type="default"
                  icon={<BackwardOutlined />}
                  onClick={() => list("sales_orders")}
                >
                  返回列表
                </Button>
              </Flex>
            }
            variant="borderless"
            style={{ height: "100%", display: "flex", flexDirection: "column" }}
            styles={{
              body: {
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: 0,
                overflow: "hidden",
              },
              header: {
                padding: "0 16px",
              },
            }}
          >
            {/*  购物车清单 (Scrollable) */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
              {cart.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="购物车为空"
                  style={{ marginTop: 40 }}
                />
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={cart}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeFromCart(item.id)}
                        />,
                      ]}
                    >
                      <List.Item.Meta
                        title={item.name}
                        description={
                          <Flex align="center" justify="space-between">
                            <Text type="secondary">
                              €{Number(item.retail_price).toFixed(2)}
                            </Text>
                          </Flex>
                        }
                      />
                      <Flex align="center" gap="small">
                        <Button
                          size="small"
                          icon={<MinusOutlined />}
                          onClick={() => updateQuantity(item.id, -1)}
                        />
                        <Text
                          strong
                          style={{ minWidth: 20, textAlign: "center" }}
                        >
                          {item.quantity}
                        </Text>
                        <Button
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => updateQuantity(item.id, 1)}
                        />
                        <Text strong style={{ width: 60, textAlign: "right" }}>
                          €{(item.retail_price * item.quantity).toFixed(2)}
                        </Text>
                      </Flex>
                    </List.Item>
                  )}
                />
              )}
            </div>

            {/* 3. 结算底栏 (Fixed) */}
            <div
              style={{
                padding: 16,
                background: "#fafafa",
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 8 }}
                >
                  支付方式 (Metodo di pagamento):
                </Text>
                <Radio.Group
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  buttonStyle="solid"
                  size="middle"
                  style={{ width: "100%", display: "flex" }}
                >
                  <Radio.Button
                    value="cash"
                    style={{ flex: 1, textAlign: "center" }}
                  >
                    💶 现金
                  </Radio.Button>
                  <Radio.Button
                    value="card"
                    style={{ flex: 1, textAlign: "center" }}
                  >
                    💳 刷卡
                  </Radio.Button>
                  <Radio.Button
                    value="transfer"
                    style={{ flex: 1, textAlign: "center" }}
                  >
                    🏦 转账
                  </Radio.Button>
                </Radio.Group>
              </div>

              <Flex
                justify="space-between"
                align="flex-end"
                style={{ marginBottom: 16 }}
              >
                <Text style={{ fontSize: 16 }}>总计 (TOTALE):</Text>
                <Statistic
                  value={totalAmount}
                  precision={2}
                  prefix="€"
                  valueStyle={{
                    color: "#3f8600",
                    fontWeight: "bold",
                    fontSize: 28,
                  }}
                />
              </Flex>

              <Button
                type="primary"
                size="large"
                block
                icon={<PayCircleOutlined />}
                onClick={handleCheckout}
                loading={isLoading}
                disabled={cart.length === 0}
                style={{ height: 50, fontSize: 18, fontWeight: "bold" }}
              >
                {isLoading ? "处理中..." : "确认收款 (CHECKOUT)"}
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </Card>
  );
};
