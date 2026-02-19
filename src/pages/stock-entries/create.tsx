import { useRef, useState } from "react";
import { Create, useForm, useSelect } from "@refinedev/antd";
import { useCreateMany, useGetIdentity, useTranslate } from "@refinedev/core";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  Button,
  Card,
  Divider,
  Radio,
  Flex,
  message,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  InboxOutlined,
  ToolOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { IInventoryComponent } from "../../interface";
import { STOCK_ENTRY_OPTIONS } from "../../constants";
import { formatCurrency } from "../../lib/utils";

export const StockEntriesCreate = () => {
  const translate = useTranslate();
  const { data: user } = useGetIdentity();
  const [totalCost, setTotalCost] = useState(0);
  const itemsRef = useRef([]);

  // 用于批量创建子项
  const { mutate: createItems } = useCreateMany();

  // 1. 获取配件数据 (支持搜索)
  // 使用 labelInValue 以便在选中后能显示名称
  const { selectProps: componentSelectProps } = useSelect<IInventoryComponent>({
    resource: "inventory_components",
    optionLabel: "name",
    optionValue: "id",
    onSearch: (value) => [{ field: "name", operator: "contains", value }],
  });

  // 2. 获取商品数据
  const { selectProps: itemSelectProps } = useSelect<IInventoryComponent>({
    resource: "inventory_items",
    optionLabel: "name",
    optionValue: "id",
  });

  // 主表单逻辑
  const { form, formProps, saveButtonProps, onFinish } = useForm({
    resource: "stock_entries",
    redirect: "list", // 创建后跳回列表
    onMutationSuccess: (data) => {
      // 1. 主表 (stock_entries) 创建成功，拿到 ID
      const entryId = data.data.id;

      // 2. 准备子表数据 (stock_entry_items)
      const finalData = itemsRef.current.map((item: any) => ({
        ...item,
        entry_id: entryId,
      }));

      // 3. 批量插入子表
      createItems(
        {
          resource: "stock_entry_items",
          values: finalData,
        },
        {
          onSuccess: () => {
            message.success(translate("stock_entries.message.success"));
          },
        },
      );
    },
  });

  // 自定义提交：处理数据结构
  const handleFinish = (values: any) => {
    // 构造主表数据
    const entryData = {
      reference_number: values.reference_number,
      type: values.type,
      created_by: user?.id,
    };

    itemsRef.current = values.items.map((item: any) => ({
      // 根据类型判断是 component_id 还是 item_id
      [item.type === "component" ? "component_id" : "item_id"]:
        item.product_id.value,
      quantity: item.quantity,
      cost_price: item.cost_price || 0,
    }));

    onFinish({ ...entryData });
  };

  // 实时计算总成本
  const handleValuesChange = (_: any, allValues: any) => {
    const items = allValues.items || [];
    const total = items.reduce((sum: number, item: any) => {
      return sum + (item?.quantity || 0) * (item?.cost_price || 0);
    }, 0);
    setTotalCost(total);
  };

  return (
    <Create
      saveButtonProps={{ ...saveButtonProps, onClick: form.submit }}
      title={translate("stock_entries.titles.create")}
    >
      <Form
        {...formProps}
        layout="vertical"
        onFinish={handleFinish}
        onValuesChange={handleValuesChange}
        initialValues={{
          type: "adjustment", // 默认类型
          items: [{ type: "component", quantity: 1, cost_price: 0 }], // 默认一行
        }}
      >
        {/* --- Header: 基础信息 (精简版) --- */}
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label={translate("stock_entries.fields.reference_number")}
              name="reference_number"
              rules={[
                {
                  required: true,
                  message: translate("stock_entries.rules.reference_number"),
                },
              ]}
              help={translate("stock_entries.help.reference_number")}
            >
              <Input
                prefix={<InboxOutlined />}
                placeholder={translate(
                  "stock_entries.placeholder.reference_number",
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={translate("stock_entries.fields.type")}
              name="type"
              rules={[{ required: true }]}
            >
              <Select
                options={STOCK_ENTRY_OPTIONS.map((o) => ({
                  ...o,
                  label: translate(o.label),
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">
          {translate("stock_entries.detail.title")}
        </Divider>

        {/* --- Items: 动态列表 (复用 PO 逻辑) --- */}
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card
                  key={key}
                  size="small"
                  style={{ marginBottom: 16, background: "#fafafa" }}
                >
                  <Row gutter={16} align="middle">
                    {/* 1. 类型切换 */}
                    <Col span={24} style={{ marginBottom: 8 }}>
                      <Form.Item
                        {...restField}
                        name={[name, "type"]}
                        noStyle // 这一行不占 label 空间
                      >
                        <Radio.Group buttonStyle="solid" size="small">
                          <Radio.Button value="component">
                            <ToolOutlined />
                            {translate("stock_entries.detail.buttons.tool")}
                          </Radio.Button>
                          <Radio.Button value="item">
                            <ShoppingCartOutlined />
                            {translate("stock_entries.detail.buttons.shop")}
                          </Radio.Button>
                        </Radio.Group>
                      </Form.Item>
                    </Col>

                    {/* 2. 选择产品 (根据类型动态切换) */}
                    <Col span={10}>
                      <Form.Item
                        shouldUpdate={(prev, curr) =>
                          prev.items?.[name]?.type !== curr.items?.[name]?.type
                        }
                        noStyle
                      >
                        {({ getFieldValue }) => {
                          const type = getFieldValue(["items", name, "type"]);
                          return (
                            <Form.Item
                              {...restField}
                              label={translate(
                                "stock_entries.detail.fields.name",
                              )}
                              name={[name, "product_id"]}
                              rules={[
                                {
                                  required: true,
                                  message: translate(
                                    "stock_entries.detail.rules.name",
                                  ),
                                },
                              ]}
                            >
                              <Select
                                {...(type === "component"
                                  ? componentSelectProps
                                  : itemSelectProps)}
                                labelInValue // 关键：保存 { value, label }
                                showSearch
                                filterOption={false}
                                placeholder={translate(
                                  "stock_entries.detail.placeholder.name",
                                )}
                              />
                            </Form.Item>
                          );
                        }}
                      </Form.Item>
                    </Col>

                    {/* 3. 数量 */}
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        label={translate(
                          "stock_entries.detail.fields.quantity",
                        )}
                        name={[name, "quantity"]}
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={1} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>

                    {/* 4. 成本 (可选，有些盘盈可能没有成本) */}
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        label={translate(
                          "stock_entries.detail.fields.cost_price",
                        )}
                        name={[name, "cost_price"]}
                        rules={[{ required: true }]}
                      >
                        <InputNumber
                          min={0}
                          prefix="€"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>

                    {/* 5. 删除按钮 */}
                    <Col span={2} style={{ textAlign: "right" }}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                        style={{ marginTop: 30 }}
                      />
                    </Col>
                  </Row>
                </Card>
              ))}

              <Flex gap="small" justify="center">
                <Button
                  type="dashed"
                  onClick={() =>
                    add({ type: "component", quantity: 1, cost_price: 0 })
                  }
                  block
                  icon={<PlusOutlined />}
                >
                  {translate("stock_entries.detail.buttons.addTool")}
                </Button>
                <Button
                  type="dashed"
                  onClick={() =>
                    add({ type: "item", quantity: 1, cost_price: 0 })
                  }
                  block
                  icon={<PlusOutlined />}
                >
                  {translate("stock_entries.detail.buttons.addShop")}
                </Button>
              </Flex>
            </>
          )}
        </Form.List>

        <Divider />
        <Row justify="end">
          <div style={{ fontSize: 18, color: "#666" }}>
            {translate("stock_entries.detail.totalText")}:{" "}
            <span style={{ color: "#000", fontWeight: "bold" }}>
              {formatCurrency(totalCost)}
            </span>
          </div>
        </Row>
      </Form>
    </Create>
  );
};
