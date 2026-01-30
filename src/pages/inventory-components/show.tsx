import { useShow, useTranslate, useOne } from "@refinedev/core";
import { Show, TextField, NumberField, DateField } from "@refinedev/antd";
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
import { PartQuality } from "../../interface";
import {
  AppstoreOutlined,
  BarcodeOutlined,
  DropboxOutlined,
  MobileOutlined,
  ShopOutlined,
} from "@ant-design/icons";

const getQualityColor = (quality: PartQuality) => {
  const map: Record<PartQuality, string> = {
    compatibile: "green",
    originale: "blue",
    service_pack_original: "orange",
    incell: "red",
    hard_oled: "green",
    soft_oled: "orange",
  };
  return map[quality];
};

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
    <Show isLoading={isLoading} title="配件详情 (Dettagli Componente)">
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
          <Card title="📦 基本信息" variant="borderless" className="shadow-sm">
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
                    {categoryName || "未分类"}
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
                    {supplierName || "未知供应商"}
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

          <Card title="📦 适配型号" variant="borderless" className="shadow-sm">
            <Descriptions
              column={1}
              labelStyle={{ width: "120px", fontWeight: "bold" }}
            >
              <Descriptions.Item label="适用手机型号">
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
            title="💰 库存与定价"
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
                <Tag color="error">库存紧张</Tag>
              )}
            </div>

            <Divider />

            {/* 价格展示 */}
            <Descriptions column={1} size="small">
              <Descriptions.Item label="进货价">
                <Statistic
                  value={record?.cost_price}
                  precision={2}
                  prefix="€"
                  valueStyle={{ fontSize: 16 }}
                />
              </Descriptions.Item>

              <Descriptions.Item label="建议维修价">
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

              <Descriptions.Item label="同行价">
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
