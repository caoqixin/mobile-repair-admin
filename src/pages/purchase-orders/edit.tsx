import { Edit, useForm, useModalForm, useSelect } from "@refinedev/antd";
import { useCreateMany, useDeleteMany, useTranslate } from "@refinedev/core";
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Row,
  Col,
  Button,
  Card,
  Divider,
  Modal,
  Space,
  Flex,
  Spin,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { QUALITY } from "../../constants";
import { IInventoryComponent } from "../../interface";

export const PurchaseOrderEdit = () => {
  const translate = useTranslate();
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [selectedModels, setSelectedModels] = useState<number[]>([]);
  const [totalCost, setTotalCost] = useState(0);

  // --- API Hooks ---
  // 1. 删除旧的子项
  const { mutateAsync: deleteItems } = useDeleteMany();
  // 2. 创建新的子项
  const { mutateAsync: createItems } = useCreateMany();
  // 3. 创建兼容性关联 (用于快速建档)
  const { mutate: mutateCompatibility } = useCreateMany({
    resource: "component_compatibility",
  });

  const {
    modalProps: createModalProps,
    formProps: createFormProps,
    show: createModalShow,
    onFinish: createModalOnFinish,
    close: createModalClose,
  } = useModalForm({
    resource: "inventory_components",
    action: "create",
    redirect: false,
    onMutationSuccess: (data) => {
      const compatibilityData = selectedModels.map((model: any) => ({
        component_id: data.data.id,
        model_id: model,
      }));
      mutateCompatibility({ values: compatibilityData });
    },
  });

  const {
    modalProps: createItemModalProps,
    formProps: createItemFormProps,
    show: createItemModalShow,
  } = useModalForm({
    resource: "inventory_items",
    action: "create",
    redirect: false,
  });

  // --- 主表单逻辑 ---
  const { form, formProps, saveButtonProps, query, onFinish } = useForm({
    meta: {
      // 关键：必须加载关联的 items 以及它们的详细信息用于回显名称
      select:
        "*, purchase_order_items(*, inventory_components(name), inventory_items(name))",
    },
  });

  // --- 数据回显逻辑 ---
  const record = query?.data?.data;
  useEffect(() => {
    if (record) {
      // 1. 设置基础字段
      // 2. 转换 Items 数据结构以匹配 Form.List
      const formattedItems = record.purchase_order_items?.map((item: any) => {
        const isComponent = !!item.component_id;
        const id = isComponent ? item.component_id : item.item_id;

        return {
          type: isComponent ? "component" : "item",
          // 构造复合 ID，让 Select 能正确显示名称
          component_id: {
            value: id,
            label: item.product_name,
          },
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        };
      });

      form.setFieldsValue({
        ...record,
        expected_arrival_date: record.expected_arrival_date
          ? dayjs(record.expected_arrival_date)
          : null,
        items: formattedItems,
      });

      // 初始化总价
      const initialTotal =
        formattedItems?.reduce((sum: number, item: any) => {
          return sum + item.quantity * item.unit_cost;
        }, 0) || 0;
      setTotalCost(initialTotal);
    }
  }, [record]);

  // --- Select Props ---
  const { selectProps: supplierSelectProps } = useSelect({
    resource: "suppliers",
    optionLabel: "name",
    defaultValue: record?.supplier_id,
  });

  const { selectProps: componentSelectProps } = useSelect<IInventoryComponent>({
    resource: "inventory_components",
    optionLabel: "name",
    optionValue: "id",
    onSearch: (value) => [{ field: "name", operator: "contains", value }],
  });

  const { selectProps: itemSelectProps } = useSelect<IInventoryComponent>({
    resource: "inventory_items",
    optionLabel: "name",
    optionValue: "id",
  });

  // 辅助 Select Props
  const { selectProps: categorySelectProps } = useSelect({
    resource: "categories",
    filters: [{ field: "type", operator: "eq", value: "component" }],
    optionLabel: "name",
  });
  const { selectProps: categoryItemSelectProps } = useSelect({
    resource: "categories",
    filters: [{ field: "type", operator: "eq", value: "item" }],
    optionLabel: "name",
  });
  const { selectProps: brandSelectProps } = useSelect({
    resource: "brands",
    optionLabel: "name",
  });
  const { selectProps: modelSelectProps } = useSelect({
    resource: "models",
    optionLabel: "name",
    filters: selectedBrand
      ? [{ field: "brand_id", operator: "eq", value: selectedBrand }]
      : [],
    queryOptions: { enabled: !!selectedBrand },
  });

  // --- 计算总价 ---
  const handleValuesChange = (_: any, allValues: any) => {
    const items = allValues.items || [];
    const total = items.reduce((sum: number, item: any) => {
      return sum + (item?.quantity || 0) * (item?.unit_cost || 0);
    }, 0);
    setTotalCost(total);
  };

  // --- 提交逻辑 ---
  const handleFinish = async (values: any) => {
    // 1. 先更新主表
    const purchaseOrderFormData = {
      supplier_id: values.supplier_id,
      status: values.status,
      total_estimated_cost: totalCost,
      expected_arrival_date: values.expected_arrival_date,
    };

    // 调用 Refine 默认的 onFinish 更新 PO 主信息
    await onFinish(purchaseOrderFormData);

    // 2. 处理 Items (全量替换策略：简单且健壮)
    if (record?.id) {
      const oldIds = record.purchase_order_items.map((i: any) => i.id);

      // A. 删除旧数据
      if (oldIds.length > 0) {
        await deleteItems({
          resource: "purchase_order_items",
          ids: oldIds,
        });
      }

      // B. 插入新数据
      const newItems = values.items.map((item: any) => ({
        purchase_order_id: record.id,
        [item.type === "component" ? "component_id" : "item_id"]:
          item.component_id.value,
        product_name: item.component_id.label, // 保存快照名称
        quantity: item.quantity,
        unit_cost: item.unit_cost,
      }));

      if (newItems.length > 0) {
        await createItems({
          resource: "purchase_order_items",
          values: newItems,
        });
      }
    }
  };

  // --- 快速建档 Modal 提交 ---
  const handleModalOnFinish = (values: any) => {
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

    createModalOnFinish(componentForm);
    createModalClose();
  };

  if (query?.isLoading) return <Spin />;

  return (
    <>
      <Edit
        saveButtonProps={{ ...saveButtonProps, onClick: () => form.submit() }}
        title="编辑进货单 (Modifica Ordine)"
      >
        <Form
          {...formProps}
          layout="vertical"
          onValuesChange={handleValuesChange}
          onFinish={handleFinish}
        >
          {/* 顶部基础信息 (Row/Col 布局与 Create 完全一致) */}
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label={translate("purchase_orders.fields.supplier")}
                name="supplier_id"
                rules={[{ required: true }]}
              >
                <Select {...supplierSelectProps} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={translate(
                  "purchase_orders.fields.expected_arrival_date",
                )}
                name="expected_arrival_date"
                getValueProps={(value) => ({
                  value: value ? dayjs(value) : undefined,
                })}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={translate("purchase_orders.fields.status")}
                name="status"
              >
                <Select
                  options={[
                    { label: "Draft", value: "draft" },
                    { label: "Ordered", value: "ordered" },
                    { label: "Received", value: "received" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">采购清单 (Lista Prodotti)</Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 16, background: "#fafafa" }}
                    extra={
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      />
                    }
                  >
                    <Row gutter={24} align="middle">
                      <Col span={10}>
                        {/* 隐藏字段存储类型 */}
                        <Form.Item name={[name, "type"]} hidden>
                          <Input />
                        </Form.Item>
                        <Row gutter={8}>
                          <Form.Item noStyle shouldUpdate>
                            {({ getFieldValue }) => {
                              const rowType = getFieldValue([
                                "items",
                                name,
                                "type",
                              ]);
                              const isComponent = rowType === "component";
                              return (
                                <>
                                  <Col flex="auto">
                                    <Form.Item
                                      {...restField}
                                      label={
                                        isComponent ? "配件名称" : "商品名称"
                                      }
                                      name={[name, "component_id"]}
                                      rules={[{ required: true }]}
                                    >
                                      <Select
                                        {...(isComponent
                                          ? componentSelectProps
                                          : itemSelectProps)}
                                        labelInValue
                                        showSearch
                                        filterOption={false} // 使用服务端搜索
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col flex="32px">
                                    <Button
                                      icon={<PlusOutlined />}
                                      type="primary"
                                      ghost
                                      style={{ marginTop: 30 }}
                                      onClick={() =>
                                        isComponent
                                          ? createModalShow()
                                          : createItemModalShow()
                                      }
                                    />
                                  </Col>
                                </>
                              );
                            }}
                          </Form.Item>
                        </Row>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          label="数量"
                          name={[name, "quantity"]}
                          rules={[{ required: true }]}
                        >
                          <InputNumber min={1} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          label="单价 (€)"
                          name={[name, "unit_cost"]}
                          rules={[{ required: true }]}
                        >
                          <InputNumber
                            min={0}
                            prefix="€"
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Flex align="center" justify="center" gap="small">
                  <Button
                    type="dashed"
                    onClick={() => add({ type: "component", quantity: 1 })}
                    block
                    icon={<PlusOutlined />}
                  >
                    添加维修配件
                  </Button>
                  <Button
                    type="dashed"
                    onClick={() => add({ type: "item", quantity: 1 })}
                    block
                    icon={<PlusOutlined />}
                  >
                    添加前台配件
                  </Button>
                </Flex>
              </>
            )}
          </Form.List>

          <Divider />
          <Row justify="end">
            <div style={{ fontSize: 20, fontWeight: "bold" }}>
              总计: € {totalCost.toFixed(2)}
            </div>
          </Row>
        </Form>
      </Edit>

      {/* 复用 Create 中的 Modal 代码结构 */}
      <Modal {...createModalProps}>
        <Form
          {...createFormProps}
          onFinish={handleModalOnFinish}
          layout="vertical"
        >
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
            initialValue={"compatibile"}
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
      </Modal>

      <Modal {...createItemModalProps}>
        <Form {...createItemFormProps} layout="vertical">
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
                  {...categoryItemSelectProps}
                  allowClear
                  placeholder="全部分类"
                />
              </Form.Item>
            </Col>
          </Row>
          <Space>
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
      </Modal>
    </>
  );
};
