import { Create, useForm, useSelect } from "@refinedev/antd";
import { useTranslate } from "@refinedev/core";
import { IInventoryItem } from "../../interface";
import { Col, Form, Input, InputNumber, Row, Select, Space } from "antd";

export const InventoryItemsCreate = () => {
  const translate = useTranslate();

  const { formProps, saveButtonProps, onFinish, form } =
    useForm<IInventoryItem>({
      resource: "inventory_items",
    });

  // 获取分类下拉数据 (仅限 component 类型)
  const { selectProps: categorySelectProps } = useSelect({
    resource: "categories",
    filters: [{ field: "type", operator: "eq", value: "item" }],
    optionLabel: "name",
    optionValue: "id",
  });

  return (
    <Create
      saveButtonProps={saveButtonProps}
      title={translate("inventory_items.form.create.title")}
    >
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
    </Create>
  );
};
