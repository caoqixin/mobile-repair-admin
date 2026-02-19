import { Create, useForm, useSelect } from "@refinedev/antd";
import { useCreateMany, useTranslate } from "@refinedev/core";
import { Col, Form, Input, InputNumber, Row, Select } from "antd";
import { useState } from "react";
import { IInventoryComponent } from "../../interface";
import { useInventoryOptions } from "../../hooks/useInventoryOptions";
import { QUALITY_OPTIONS } from "../../constants";

export const InventoryComponentsCreate = () => {
  const translate = useTranslate();
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

  // 获取供应商列表
  const { selectProps: supplierSelectProps } = useSelect({
    resource: "suppliers",
    optionLabel: "name",
    optionValue: "id",
    pagination: {
      mode: "off",
    },
  });

  const {
    categorySelectProps,
    brandSelectProps,
    modelSelectProps,
    handleBrandChange,
    selectedBrand,
    isModelLoading,
  } = useInventoryOptions();

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
      title={translate("inventory_components.titles.create")}
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
                onSearch={undefined}
                filterOption={true}
                optionFilterProp="label"
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
                onSearch={undefined}
                filterOption={true}
                optionFilterProp="label"
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
                onSearch={undefined}
                filterOption={true}
                optionFilterProp="label"
                onChange={(val) => {
                  handleBrandChange(val as unknown as number);
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
                disabled={!selectedBrand || isModelLoading}
                onSearch={undefined}
                filterOption={true}
                optionFilterProp="label"
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
          initialValue="compatibile"
        >
          <Select options={QUALITY_OPTIONS} />
        </Form.Item>
        <Row gutter={24}>
          <Col span={6}>
            <Form.Item
              label={translate("inventory_components.fields.stock")}
              name={["stock_quantity"]}
              initialValue={0}
            >
              <InputNumber min={0} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label={translate("inventory_components.fields.cost")}
              name={["cost_price"]}
              initialValue={0}
            >
              <InputNumber min={0} prefix="€" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label={translate("inventory_components.fields.repair_price")}
              name={["suggested_repair_price"]}
              initialValue={0}
            >
              <InputNumber min={0} prefix="€" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label={translate("inventory_components.fields.partner_price")}
              name={["partner_repair_price"]}
              initialValue={0}
            >
              <InputNumber min={0} prefix="€" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
