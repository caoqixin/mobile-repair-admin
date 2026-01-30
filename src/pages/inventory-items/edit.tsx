import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select, Row, Col, Space, InputNumber } from "antd";
import { useTranslate } from "@refinedev/core";

export const InventoryItemsEdit = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps, query } = useForm();

  const Data = query?.data?.data;

  const { selectProps: categorySelectProps } = useSelect({
    resource: "categories",
    defaultValue: Data?.category_id,
    optionLabel: "name",
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label={translate("inventory_items.fields.sku")}
              name={["sku"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={translate("inventory_items.fields.name")}
              name={["name"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={6}>
            <Form.Item
              label={translate("inventory_items.fields.category")}
              name={["category_id"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select
                {...categorySelectProps}
                allowClear
                placeholder="全部分类"
              />
            </Form.Item>
          </Col>
        </Row>
        <Space>
          <Form.Item
            label={translate("inventory_items.fields.stock")}
            name={["stock_quantity"]}
          >
            <InputNumber min={0} placeholder="0" />
          </Form.Item>
          <Form.Item
            label={translate("inventory_items.fields.cost")}
            name={["cost_price"]}
          >
            <InputNumber min={0} placeholder="0.00" prefix="€" />
          </Form.Item>
          <Form.Item
            label={translate("inventory_items.fields.retail_price")}
            name={["retail_price"]}
          >
            <InputNumber min={0} placeholder="0.00" prefix="€" />
          </Form.Item>
        </Space>
      </Form>
    </Edit>
  );
};
