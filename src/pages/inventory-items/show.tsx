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
import { IInventoryItem } from "../../interface";
import { formatCurrency } from "../../lib/utils";

const { Title, Text } = Typography;

export const InventoryItemsShow = () => {
  const translate = useTranslate();

  // 获取主记录
  const {
    result: record,
    query: { isLoading },
  } = useShow<IInventoryItem>();

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
    <Show
      isLoading={isLoading}
      title={translate("inventory_items.titles.show", { name: record?.name })}
    >
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
            {categoryIsLoading ? translate("loading") : categoryData?.name}
          </Tag>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* 左侧：详细信息区 */}
        <Col xs={24} lg={16}>
          <Card
            title={translate("inventory_items.titles.information")}
            variant="borderless"
            className="shadow-sm"
          >
            <Descriptions
              column={1}
              styles={{ label: { fontWeight: "bold", width: "140px" } }}
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
            title={translate("inventory_items.titles.financial")}
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
                  {translate("inventory_items.text.lowStock")}
                </Tag>
              )}
            </div>

            <Divider />

            {/* 价格板块 */}
            <Descriptions column={1} size="small" layout="horizontal">
              <Descriptions.Item
                label={translate("inventory_items.labels.retail")}
              >
                <Text strong style={{ fontSize: 18, color: "#1890ff" }}>
                  <EuroCircleOutlined />{" "}
                  {formatCurrency(record?.retail_price as number)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={translate("inventory_items.labels.cost")}
              >
                <Text type="secondary">
                  <EuroCircleOutlined />{" "}
                  {formatCurrency(record?.cost_price as number)}
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
                  <RiseOutlined /> {translate("inventory_items.text.profit")}
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
