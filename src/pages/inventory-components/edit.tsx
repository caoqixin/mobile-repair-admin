import { Edit, useForm, useSelect } from "@refinedev/antd";
import {
  useCreateMany,
  useDeleteMany,
  useList,
  useParsed,
  useTranslate,
} from "@refinedev/core";
import { Col, Form, Input, InputNumber, Row, Select } from "antd";
import { useEffect, useState } from "react";
import { QUALITY } from "../../constants";
import { IComponentCompatibility } from "../../interface";
import { useInventoryOptions } from "../../hooks/useInventoryOptions";

export const InventoryComponentsEdit = () => {
  const translate = useTranslate();
  const { id } = useParsed();
  // 获取component_compatibility
  const { result } = useList({
    resource: "component_compatibility",
    filters: [
      {
        field: "component_id",
        operator: "eq",
        value: id,
      },
    ],
  });

  // 用于联动：选了品牌后，机型下拉框只显示该品牌的机型
  const [selectedModels, setSelectedModels] = useState<number[]>([]);
  const { mutate: deleteMany } = useDeleteMany<IComponentCompatibility>();
  const { mutate } = useCreateMany({
    resource: "component_compatibility",
  });

  const { formProps, saveButtonProps, query, onFinish, form } = useForm({
    meta: {
      select:
        "*, categories(id, name), component_compatibility!inner(model_id,models!inner(brand_id))",
    },
    onMutationSuccess: (data) => {
      const fetchedModelIds = result.data.map((res) => res.model_id);

      // 检查当前选中的值是否和原始数据不同
      const hasChanged =
        selectedModels.length !== fetchedModelIds.length ||
        selectedModels.some((id) => !fetchedModelIds.includes(id));
      if (hasChanged) {
        // 删除旧的
        deleteMany(
          {
            resource: "component_compatibility",
            ids: [...result.data.map((res) => res.id as number)],
          },
          {
            onSuccess: () => {
              // 添加新的
              const componentCompatibilityForm = selectedModels.map(
                (model: any) => ({
                  component_id: data.data.id,
                  model_id: model,
                }),
              );
              mutate({ values: componentCompatibilityForm });
            },
          },
        );
      }
    },
  });

  const Data = query?.data?.data;

  const {
    categorySelectProps,
    brandSelectProps,
    modelSelectProps,
    handleBrandChange,
    selectedBrand,
  } = useInventoryOptions({ initialBrandId: Data?.brand_id });

  const { selectProps: supplierSelectProps } = useSelect({
    resource: "suppliers",
    defaultValue: Data?.supplier_id,
    optionLabel: "name",
  });

  useEffect(() => {
    const modelId = Data?.component_compatibility.map(
      (com: { model_id: number }) => com.model_id,
    );

    const brandId: number[] = Array.from(
      new Set(
        Data?.component_compatibility.map(
          (com: { models: { brand_id: number } }) => com.models.brand_id,
        ),
      ),
    );

    handleBrandChange(brandId[0]);
    setSelectedModels(modelId);

    form?.setFieldsValue({
      brand_id: brandId[0],
      model_id: modelId,
    });
  }, [Data, form]);

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
    <Edit
      saveButtonProps={saveButtonProps}
      title={translate("inventory_components.titles.edit", {
        name: Data?.name,
      })}
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
                placeholder={translate(
                  "inventory_components.search.placeholder.category",
                )}
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
                placeholder={translate(
                  "inventory_components.search.placeholder.supplier",
                )}
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
                placeholder={translate(
                  "inventory_components.search.placeholder.brand",
                )}
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
                placeholder={
                  selectedBrand
                    ? translate("inventory_components.search.placeholder.model")
                    : translate(
                        "inventory_components.search.placeholder.noModel",
                      )
                }
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
    </Edit>
  );
};
