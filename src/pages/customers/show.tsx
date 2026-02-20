import { DateField, Show, ShowButton } from "@refinedev/antd";
import { useShow, useTranslate } from "@refinedev/core";
import { Card, Descriptions, Space, Table, Tag, Typography } from "antd";
import { MobileOutlined, ToolOutlined } from "@ant-design/icons";
import { formatCurrency, getRepairStatusTag } from "../../lib/utils";

const { Text } = Typography;

export const CustomerShow = () => {
  const translate = useTranslate();
  const {
    result: record,
    query: { isLoading },
  } = useShow({
    meta: {
      select: "*, repair_orders(*, models(name))",
    },
  });

  return (
    <Show
      isLoading={isLoading}
      title={translate("customers.titles.show", { name: record?.full_name })}
    >
      {/* 1. 客户基本信息 */}
      <Card variant="borderless" style={{ marginBottom: 24 }}>
        <Descriptions
          title={translate("customers.info.baseTitle")}
          bordered
          column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}
        >
          <Descriptions.Item label={translate("customers.fields.full_name")}>
            <Text strong style={{ fontSize: 16 }}>
              {record?.full_name}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label={translate("customers.fields.phone")}>
            {record?.phone || "-"}
          </Descriptions.Item>
          <Descriptions.Item label={translate("customers.fields.created_at")}>
            <DateField value={record?.created_at} />
          </Descriptions.Item>
          <Descriptions.Item label="ID" span={2}>
            <Text type="secondary" copyable>
              {record?.id}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 2. 维修记录列表 */}
      <Card
        title={
          <span>
            <ToolOutlined /> {translate("customers.info.historyTitle")} (
            {record?.repair_orders?.length || 0})
          </span>
        }
        variant="borderless"
      >
        <Table
          dataSource={record?.repair_orders}
          rowKey="id"
          pagination={false}
          size="small"
        >
          <Table.Column
            title={translate("customers.info.no")}
            dataIndex="readable_id"
            render={(val) => <b>{val}</b>}
          />

          <Table.Column
            title={translate("customers.info.device")}
            render={(_, item: any) => (
              <Space>
                <MobileOutlined />
                {/* 注意：这里的数据结构是 item.models.name */}
                {item.models?.name}
              </Space>
            )}
          />

          <Table.Column
            title={translate("customers.info.problem")}
            dataIndex="problem_description"
            render={(val: string) =>
              val.split(",").map((desc) => <Tag key={desc}>{desc}</Tag>)
            }
          />

          <Table.Column
            title={translate("customers.info.status")}
            dataIndex="status"
            render={(val) => {
              const conf = getRepairStatusTag(val);

              return <Tag color={conf.color}>{translate(conf.label)}</Tag>;
            }}
          />

          <Table.Column
            title={translate("customers.info.total_price")}
            dataIndex="total_price"
            render={(val) =>
              val > 0 ? (
                <Text>{formatCurrency(val)}</Text>
              ) : (
                <Tag color="green">{translate("customers.info.warranty")}</Tag>
              )
            }
          />

          <Table.Column
            title={translate("customers.info.date")}
            dataIndex="created_at"
            render={(val) => <DateField value={val} format="DD/MM/YYYY" />}
          />

          <Table.Column
            title={translate("table.actions")}
            render={(_, item: any) => (
              // 跳转到 RepairOrderShow
              <ShowButton
                hideText
                size="small"
                resource="repair_orders"
                recordItemId={item.id}
              />
            )}
          />
        </Table>
      </Card>
    </Show>
  );
};
