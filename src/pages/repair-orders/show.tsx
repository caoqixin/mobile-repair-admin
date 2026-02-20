import { useShow, useTranslate } from "@refinedev/core";
import { Show, DateField } from "@refinedev/antd";
import {
  Typography,
  Card,
  Descriptions,
  Table,
  Tag,
  Row,
  Col,
  Divider,
} from "antd";
import { UserOutlined, MobileOutlined } from "@ant-design/icons";
import { REPAIR_STATUS_OPTIONS } from "../../constants";
import { formatCurrency } from "../../lib/utils";

const { Title, Text } = Typography;

export const RepairOrderShow = () => {
  const translate = useTranslate();
  const { query } = useShow({
    meta: {
      select:
        "*, customers(full_name, phone), models(name), repair_order_parts(*, inventory_components(name, sku)), profiles(full_name,email)",
    },
  });
  const { data, isLoading } = query;
  const record = data?.data;

  return (
    <Show
      isLoading={isLoading}
      title={translate("repair_orders.titles.show", {
        id: record?.readable_id,
      })}
    >
      <Row gutter={24}>
        <Col span={16}>
          <Card variant="borderless" style={{ marginBottom: 24 }}>
            <Title level={4}>
              <MobileOutlined /> {translate("repair_orders.info.device.title")}
            </Title>
            <Descriptions column={2}>
              <Descriptions.Item
                label={translate("repair_orders.info.device.model")}
              >
                {record?.models?.name}
              </Descriptions.Item>
              <Descriptions.Item
                label={translate("repair_orders.info.device.imei")}
              >
                {record?.imei_sn}
              </Descriptions.Item>
              <Descriptions.Item
                label={translate("repair_orders.info.device.problem")}
                span={2}
              >
                {record?.problem_description}
              </Descriptions.Item>
            </Descriptions>
            <Divider />
            <Title level={4}>
              <UserOutlined /> {translate("repair_orders.info.customer.title")}
            </Title>
            <Descriptions column={2}>
              <Descriptions.Item
                label={translate("repair_orders.info.customer.name")}
              >
                {record?.customers?.full_name}
              </Descriptions.Item>
              <Descriptions.Item
                label={translate("repair_orders.info.customer.phone")}
              >
                {record?.customers?.phone}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title={translate("repair_orders.info.component.title")}
            variant="borderless"
          >
            <Table
              dataSource={record?.repair_order_parts}
              pagination={false}
              rowKey="id"
              size="small"
            >
              <Table.Column
                title={translate("repair_orders.info.component.name")}
                render={(_, r: any) => r.inventory_components?.name}
              />
              <Table.Column
                title={translate("repair_orders.info.component.unit_price")}
                dataIndex="unit_price"
                render={(v) => `€${v}`}
              />
              <Table.Column
                title={translate("repair_orders.info.component.quantity")}
                dataIndex="quantity"
              />
              <Table.Column
                title={translate("repair_orders.info.component.price")}
                render={(_, r: any) =>
                  formatCurrency(r.unit_price * r.quantity)
                }
              />
            </Table>
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title={translate("repair_orders.info.order.title")}
            variant="borderless"
            style={{ marginBottom: 24 }}
          >
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <Tag color="blue" style={{ fontSize: 18, padding: "5px 15px" }}>
                {translate(
                  REPAIR_STATUS_OPTIONS.find(
                    (option) => option.value === record?.status,
                  )?.label as string,
                )}
              </Tag>
            </div>
            <Descriptions column={1}>
              <Descriptions.Item
                label={translate("repair_orders.info.order.created_at")}
              >
                <DateField value={record?.created_at} format="DD/MM/YYYY" />
              </Descriptions.Item>
              <Descriptions.Item
                label={translate("repair_orders.info.order.tech")}
              >
                {record?.profiles?.full_name ?? record?.profiles?.email}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title={translate("repair_orders.info.checkout.title")}
            variant="borderless"
          >
            <Descriptions column={1} bordered size="small">
              {record?.status === "delivered" && (
                <Descriptions.Item
                  label={translate(
                    "repair_orders.info.checkout.payment_method",
                  )}
                >
                  <Text strong style={{ color: "#3f8600", fontSize: 16 }}>
                    {record?.payment_method}
                  </Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item
                label={translate("repair_orders.info.checkout.total_price")}
              >
                <Text strong style={{ color: "#3f8600", fontSize: 16 }}>
                  {formatCurrency(record?.total_price)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={translate("repair_orders.info.checkout.deposit")}
              >
                - {formatCurrency(record?.deposit)}
              </Descriptions.Item>
              <Descriptions.Item
                label={translate("repair_orders.info.checkout.rest")}
              >
                <Text strong>
                  {formatCurrency(record?.total_price - record?.deposit)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Show>
  );
};
