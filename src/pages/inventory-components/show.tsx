import { useShow, useTranslate, useOne } from "@refinedev/core";
import { Show, DateField } from "@refinedev/antd";
import {
  Card,
  Col,
  Descriptions,
  Divider,
  Row,
  Skeleton,
  Statistic,
  Tag,
  Typography,
} from "antd";
import {
  AppstoreOutlined,
  BarcodeOutlined,
  DropboxOutlined,
  MobileOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { getQualityColor } from "../../lib/utils";

export const InventoryComponentsShow = () => {
  const translate = useTranslate();
  const {
    result: record,
    query: { isLoading },
  } = useShow({
    meta: {
      select: "*, component_compatibility!inner(models(name))",
    },
  });

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

  const {
    result: supplierData,
    query: { isLoading: supplierIsLoading },
  } = useOne({
    resource: "suppliers",
    id: record?.supplier_id || "",
    queryOptions: {
      enabled: !!record,
    },
  });

  const categoryName = categoryData?.name;
  const supplierName = supplierData?.name;

  return (
    <Show
      isLoading={isLoading}
      title={translate("inventory_components.title.show")}
    >
      {/* 顶部：核心识别信息 */}
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {record?.name || <Skeleton.Input active size="small" />}
        </Typography.Title>
        <Tag
          icon={<BarcodeOutlined />}
          color="geekblue"
          style={{ marginTop: 8 }}
        >
          SKU: {record?.sku}
        </Tag>
      </div>

      <Row gutter={[24, 24]}>
        {/* 左侧：基本属性 */}
        <Col xs={24} lg={16}>
          <Card
            title={translate("inventory_components.titles.detail")}
            variant="borderless"
            className="shadow-sm"
          >
            <Descriptions
              column={1}
              labelStyle={{ width: "120px", fontWeight: "bold" }}
            >
              <Descriptions.Item
                label={translate("inventory_components.fields.category")}
              >
                {categoryIsLoading ? (
                  <Skeleton.Input size="small" active />
                ) : (
                  <span>
                    <AppstoreOutlined
                      style={{ marginRight: 8, color: "#1890ff" }}
                    />
                    {categoryName}
                  </span>
                )}
              </Descriptions.Item>

              <Descriptions.Item
                label={translate("inventory_components.fields.supplier")}
              >
                {supplierIsLoading ? (
                  <Skeleton.Input size="small" active />
                ) : (
                  <span>
                    <ShopOutlined
                      style={{ marginRight: 8, color: "#eb2f96" }}
                    />
                    {supplierName}
                  </span>
                )}
              </Descriptions.Item>

              <Descriptions.Item
                label={translate("inventory_components.fields.quality")}
              >
                <Tag color={getQualityColor(record?.quality)}>
                  {record?.quality}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item
                label={translate("inventory_components.fields.created_at")}
              >
                <DateField
                  value={record?.created_at}
                  format="YYYY-MM-DD HH:mm"
                />
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title={translate("inventory_components.titles.compatible_model")}
            variant="borderless"
            className="shadow-sm"
          >
            <Descriptions
              column={1}
              labelStyle={{ width: "120px", fontWeight: "bold" }}
            >
              <Descriptions.Item
                label={translate("inventory_components.labels.models")}
              >
                {record?.component_compatibility.map(
                  (models: { models: { name: string } }) => (
                    <Tag key={models.models.name} icon={<MobileOutlined />}>
                      {models.models.name}
                    </Tag>
                  ),
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* 右侧：库存与财务 (高亮显示) */}
        <Col xs={24} lg={8}>
          <Card
            title={translate("inventory_components.titles.stock_price")}
            variant="borderless"
            style={{ height: "100%" }}
            styles={{ header: { backgroundColor: "#fafafa" } }}
          >
            {/* 库存展示 */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <Statistic
                title={translate("inventory_components.fields.stock")}
                value={record?.stock_quantity}
                prefix={<DropboxOutlined />}
                valueStyle={{
                  color:
                    (record?.stock_quantity || 0) < 5 ? "#cf1322" : "#3f8600",
                }}
              />
              {(record?.stock_quantity || 0) < 5 && (
                <Tag color="error">
                  {translate("inventory_components.text.sold_out")}
                </Tag>
              )}
            </div>

            <Divider />

            {/* 价格展示 */}
            <Descriptions column={1} size="small">
              <Descriptions.Item
                label={translate("inventory_components.labels.cost_price")}
              >
                <Statistic
                  value={record?.cost_price}
                  precision={2}
                  prefix="€"
                  valueStyle={{ fontSize: 16 }}
                />
              </Descriptions.Item>

              <Descriptions.Item
                label={translate(
                  "inventory_components.labels.suggested_repair_price",
                )}
              >
                <Statistic
                  value={record?.suggested_repair_price}
                  precision={2}
                  prefix="€"
                  valueStyle={{
                    color: "#1890ff",
                    fontSize: 20,
                    fontWeight: "bold",
                  }}
                />
              </Descriptions.Item>

              <Descriptions.Item
                label={translate(
                  "inventory_components.labels.partner_repair_price",
                )}
              >
                <Statistic
                  value={record?.partner_repair_price}
                  precision={2}
                  prefix="€"
                  valueStyle={{ color: "#faad14", fontSize: 16 }}
                />
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Show>
  );
};
