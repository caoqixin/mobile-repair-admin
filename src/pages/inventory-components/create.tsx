import { Create, useForm, useSelect } from "@refinedev/antd";
import { useCreateMany, useTranslate } from "@refinedev/core";
import { Col, Form, Input, InputNumber, Row, Select } from "antd";
import { useState } from "react";
import { QUALITY } from "../../constants";
import { IInventoryComponent } from "../../interface";

export const InventoryComponentsCreate = () => {
  const translate = useTranslate();
  // 用于联动：选了品牌后，机型下拉框只显示该品牌的机型
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [selectedModels, setSelectedModels] = useState<number[]>([]);
  const { mutate } = useCreateMany({
    resource: "component_compatibility",
  });
  const { formProps, saveButtonProps, onFinish, form } =
    useForm<IInventoryComponent>({
      resource: "inventory_components",
      onMutationSuccess: (data) => {
        const componentCompatibilityForm = selectedModels.map((model: any) => ({
          component_id: data.data.id,
          model_id: model,
        }));

        mutate({ values: componentCompatibilityForm });
      },
    });

  // 获取分类下拉数据 (仅限 component 类型)
  const { selectProps: categorySelectProps } = useSelect({
    resource: "categories",
    filters: [{ field: "type", operator: "eq", value: "component" }],
    optionLabel: "name",
    optionValue: "id",
  });

  // 获取供应商列表
  const { selectProps: supplierSelectProps } = useSelect({
    resource: "suppliers",
    optionLabel: "name",
    optionValue: "id",
  });

  // 获取品牌下拉数据
  const { selectProps: brandSelectProps } = useSelect({
    resource: "brands",
    optionLabel: "name",
    optionValue: "id",
  });

  // 获取机型下拉数据 (依赖选中的品牌)
  const { selectProps: modelSelectProps } = useSelect({
    resource: "models",
    optionLabel: "name",
    optionValue: "id",
    filters: selectedBrand
      ? [{ field: "brand_id", operator: "eq", value: selectedBrand }]
      : [],
    queryOptions: {
      enabled: !!selectedBrand, // 只有选了品牌才加载机型
    },
  });

  const handleFinish = (values: any) => {
    const componentForm = {
      sku: values.sku,
      name: values.name,
      category_id: values.category_id,
      supplier_id: values.supplier_id,
      quality: values.quality,
      stock_quantity: values.stock_quantity,
      cost_price: values.cost_price,
      suggested_repair_price: values.suggested_repair_price,
      partner_repair_price: values.partner_repair_price,
    };

    onFinish(componentForm);
  };

  return (
    <Create
      saveButtonProps={saveButtonProps}
      title={translate("inventory_components.form.create.title")}
    >
      <Form {...formProps} onFinish={handleFinish} layout="vertical">
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label={translate("inventory_components.fields.sku")}
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
              label={translate("inventory_components.fields.name")}
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
              label={translate("inventory_components.fields.category")}
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
          <Col span={6}>
            <Form.Item
              label={translate("inventory_components.fields.supplier")}
              name={["supplier_id"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select
                {...supplierSelectProps}
                allowClear
                placeholder="全部供应商"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label={translate("inventory_components.fields.brand")}
              name={["brand_id"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select
                {...brandSelectProps}
                allowClear
                placeholder="先选品牌"
                onChange={(val) => {
                  setSelectedBrand(val as unknown as number);
                  form?.setFieldValue("model_id", null);
                }}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label={translate("inventory_components.fields.model")}
              name={["model_id"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select
                {...modelSelectProps}
                mode="multiple"
                allowClear
                placeholder={selectedBrand ? "选择机型" : "请先选择品牌"}
                disabled={!selectedBrand}
                onChange={(val) => {
                  setSelectedModels(val as unknown as number[]);
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={translate("inventory_components.fields.quality")}
          name={["quality"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            options={QUALITY.map((val) => ({
              label: val,
              value: val,
            }))}
          />
        </Form.Item>
        <Row gutter={24}>
          <Col span={6}>
            <Form.Item
              label={translate("inventory_components.fields.stock")}
              name={["stock_quantity"]}
            >
              <InputNumber min={0} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label={translate("inventory_components.fields.cost")}
              name={["cost_price"]}
            >
              <InputNumber min={0} prefix="€" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label={translate("inventory_components.fields.repair_price")}
              name={["suggested_repair_price"]}
            >
              <InputNumber min={0} prefix="€" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label={translate("inventory_components.fields.partner_price")}
              name={["partner_repair_price"]}
            >
              <InputNumber min={0} prefix="€" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
