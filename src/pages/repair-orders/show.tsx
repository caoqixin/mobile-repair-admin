import { useShow } from "@refinedev/core";
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
  Statistic,
} from "antd";
import { ToolOutlined, UserOutlined, MobileOutlined } from "@ant-design/icons";
import { REPAIR_STATUS_OPTIONS } from "../../constants";

const { Title, Text } = Typography;

export const RepairOrderShow = () => {
  const { query } = useShow({
    meta: {
      select:
        "*, customers(full_name, phone), models(name), repair_order_parts(*, inventory_components(name, sku)), profiles(full_name)",
    },
  });
  const { data, isLoading } = query;
  const record = data?.data;

  return (
    <Show isLoading={isLoading} title={`工单 #${record?.readable_id}`}>
      <Row gutter={24}>
        <Col span={16}>
          <Card variant="borderless" style={{ marginBottom: 24 }}>
            <Title level={4}>
              <MobileOutlined /> 设备信息
            </Title>
            <Descriptions column={2}>
              <Descriptions.Item label="型号">
                {record?.models?.name}
              </Descriptions.Item>
              <Descriptions.Item label="IMEI/SN">
                {record?.imei_sn}
              </Descriptions.Item>
              <Descriptions.Item label="故障描述" span={2}>
                {record?.problem_description}
              </Descriptions.Item>
            </Descriptions>
            <Divider />
            <Title level={4}>
              <UserOutlined /> 客户信息
            </Title>
            <Descriptions column={2}>
              <Descriptions.Item label="姓名">
                {record?.customers?.full_name}
              </Descriptions.Item>
              <Descriptions.Item label="电话">
                {record?.customers?.phone}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="配件明细" variant="borderless">
            <Table
              dataSource={record?.repair_order_parts}
              pagination={false}
              rowKey="id"
              size="small"
            >
              <Table.Column
                title="配件"
                render={(_, r: any) => r.inventory_components?.name}
              />
              <Table.Column
                title="单价"
                dataIndex="unit_price"
                render={(v) => `€${v}`}
              />
              <Table.Column title="数量" dataIndex="quantity" />
              <Table.Column
                title="小计"
                render={(_, r: any) =>
                  `€${(r.unit_price * r.quantity).toFixed(2)}`
                }
              />
            </Table>
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title="订单状态"
            variant="borderless"
            style={{ marginBottom: 24 }}
          >
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <Tag color="blue" style={{ fontSize: 18, padding: "5px 15px" }}>
                {
                  REPAIR_STATUS_OPTIONS.find(
                    (option) => option.value === record?.status,
                  )?.label
                }
              </Tag>
            </div>
            <Descriptions column={1}>
              <Descriptions.Item label="创建时间">
                <DateField value={record?.created_at} format="DD/MM/YYYY" />
              </Descriptions.Item>
              <Descriptions.Item label="技师">
                {record?.profiles?.full_name}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="财务结算" variant="borderless">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="维修费用 (Total)">
                <Text strong style={{ color: "#3f8600", fontSize: 16 }}>
                  € {Number(record?.total_price).toFixed(2)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="已付定金">
                - € {Number(record?.deposit).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="应收尾款">
                <Text strong>
                  € {Number(record?.total_price - record?.deposit).toFixed(2)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Show>
  );
};
