import { AntdShowInferencer } from "@refinedev/inferencer/antd";

import { useShow, useTranslate, useOne } from "@refinedev/core";
import { Show, DateField } from "@refinedev/antd";
import {
  Typography,
  Row,
  Col,
  Card,
  Descriptions,
  Tag,
  Statistic,
  Divider,
  Skeleton,
} from "antd";
import {
  BarcodeOutlined,
  AppstoreOutlined,
  RiseOutlined,
  InboxOutlined,
  EuroCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export const InventoryItemsShow = () => {
  const translate = useTranslate();

  // 获取主记录
  const {
    result: record,
    query: { isLoading },
  } = useShow();

  // 获取分类数据
  const {
    result: categoryData,
    query: { isLoading: categoryIsLoading },
  } = useOne({
    resource: "categories",
    id: record?.category_id || "",
    queryOptions: {
      enabled: !!record,
    },
  });

  // 计算利润 (仅作展示参考)
  const profit = (record?.retail_price || 0) - (record?.cost_price || 0);
  const profitPercent = record?.cost_price
    ? ((profit / record.cost_price) * 100).toFixed(1)
    : 0;

  return (
    <Show isLoading={isLoading} title="商品详情 (Dettagli Prodotto)">
      {/* 顶部标题区：名称与SKU */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          {record?.name || (
            <Skeleton.Input style={{ width: 200 }} active size="small" />
          )}
        </Title>
        <div style={{ marginTop: 8 }}>
          <Tag icon={<BarcodeOutlined />} color="blue">
            SKU: {record?.sku || "---"}
          </Tag>
          <Tag color={categoryIsLoading ? "default" : "cyan"}>
            {categoryIsLoading
              ? "Loading..."
              : categoryData?.data?.name || "Uncategorized"}
          </Tag>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* 左侧：详细信息区 */}
        <Col xs={24} lg={16}>
          <Card
            title="📦 基本信息 (Informazioni di Base)"
            variant="borderless"
            className="shadow-sm"
          >
            <Descriptions
              column={1}
              labelStyle={{ fontWeight: "bold", width: "140px" }}
            >
              <Descriptions.Item label={translate("inventory_items.fields.id")}>
                <Text copyable>{record?.id}</Text>
              </Descriptions.Item>

              <Descriptions.Item
                label={translate("inventory_items.fields.category")}
              >
                {categoryIsLoading ? (
                  <Skeleton.Input size="small" active />
                ) : (
                  <span>
                    <AppstoreOutlined
                      style={{ marginRight: 8, color: "#13c2c2" }}
                    />
                    {categoryData?.name}
                  </span>
                )}
              </Descriptions.Item>

              <Descriptions.Item
                label={translate("inventory_items.fields.created_at")}
              >
                <DateField
                  value={record?.created_at}
                  format="YYYY-MM-DD HH:mm"
                />
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* 右侧：财务与库存卡片 */}
        <Col xs={24} lg={8}>
          <Card
            title="💰 财务与库存 (Finanza & Stock)"
            variant="borderless"
            styles={{
              body: { padding: 24 },
              header: { backgroundColor: "#fafafa" },
            }}
          >
            {/* 库存板块 */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Statistic
                title={translate("inventory_items.fields.stock")}
                value={record?.stock_quantity}
                prefix={<InboxOutlined />}
                valueStyle={{
                  color:
                    (record?.stock_quantity || 0) < 10 ? "#faad14" : "#3f8600",
                }}
              />
              {(record?.stock_quantity || 0) <= 5 && (
                <Tag color="error" style={{ marginTop: 8 }}>
                  低库存警告
                </Tag>
              )}
            </div>

            <Divider />

            {/* 价格板块 */}
            <Descriptions column={1} size="small" layout="horizontal">
              <Descriptions.Item label="零售价 (Retail)">
                <Text strong style={{ fontSize: 18, color: "#1890ff" }}>
                  <EuroCircleOutlined />{" "}
                  {Number(record?.retail_price).toFixed(2)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="进货价 (Cost)">
                <Text type="secondary">
                  <EuroCircleOutlined /> {Number(record?.cost_price).toFixed(2)}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {/* 利润预估 */}
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: "#f6ffed",
                border: "1px solid #b7eb8f",
                borderRadius: 6,
              }}
            >
              <Row align="middle" justify="space-between">
                <Text type="success">
                  <RiseOutlined /> 预估利润
                </Text>
                <Text strong style={{ color: "#52c41a" }}>
                  +€ {profit.toFixed(2)} ({profitPercent}%)
                </Text>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>
    </Show>
  );
};
