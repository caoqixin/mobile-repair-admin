import { Create, useForm, useModalForm, useSelect } from "@refinedev/antd";
import { useCreateMany, useGetIdentity, useTranslate } from "@refinedev/core";
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
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useRef, useState } from "react";
import { QUALITY, QUALITY_OPTIONS } from "../../constants";
import { IInventoryComponent } from "../../interface";
import { useInventoryOptions } from "../../hooks/useInventoryOptions";

export const PurchaseOrderCreate = () => {
  // 用于联动：选了品牌后，机型下拉框只显示该品牌的机型
  const [selectedModels, setSelectedModels] = useState<number[]>([]);

  // 用于purchase_order_items
  const itemsRef = useRef([]);
  const { mutate: itemsMutate } = useCreateMany({
    resource: "purchase_order_items",
  });

  const { mutate } = useCreateMany({
    resource: "component_compatibility",
  });

  const translate = useTranslate();
  // 当前身份信息
  const { data } = useGetIdentity();
  const [totalCost, setTotalCost] = useState(0);

  // --- 快速建档 Modal 相关状态 ---
  // 创建新配件弹窗表单
  const {
    modalProps: createModalProps,
    formProps: createFormProps,
    show: createModalShow,
    onFinish: createModalOnFinish,
    close,
    open: createModalOpen,
  } = useModalForm({
    warnWhenUnsavedChanges: false,
    resource: "inventory_components",
    action: "create",
    defaultVisible: false,
    redirect: false,
    onMutationSuccess: (data) => {
      const componentCompatibilityForm = selectedModels.map((model: any) => ({
        component_id: data.data.id,
        model_id: model,
      }));

      mutate({ values: componentCompatibilityForm });
    },
  });

  const {
    modalProps: createItemModalProps,
    formProps: createItemFormProps,
    show: createItemModalShow,
    open: createItemModalOpen,
  } = useModalForm({
    warnWhenUnsavedChanges: false,
    resource: "inventory_items",
    action: "create",
    defaultVisible: false,
    redirect: false,
  });

  // 主表单
  const { form, formProps, saveButtonProps, onFinish } = useForm({
    resource: "purchase_orders",
    onMutationSuccess: (data) => {
      const finalData = itemsRef.current.map((item: any) => ({
        ...item,
        purchase_order_id: data.data.id,
      }));

      itemsMutate({
        values: finalData,
      });
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

  // 1. 获取供应商
  const { selectProps: supplierSelectProps } = useSelect({
    resource: "suppliers",
    optionLabel: "name",
    pagination: {
      mode: "off",
    },
  });

  // 2. 获取配件 (支持搜索)
  const { selectProps: componentSelectProps } = useSelect<IInventoryComponent>({
    resource: "inventory_components",
    optionLabel: "name",
    optionValue: "id",
    pagination: {
      mode: "off",
    },
  });

  const { selectProps: itemSelectProps } = useSelect<IInventoryComponent>({
    resource: "inventory_items",
    optionLabel: "name",
    optionValue: "id",
    pagination: {
      mode: "off",
    },
  });

  const { selectProps: categoryItemSelectProps } = useSelect({
    resource: "categories",
    filters: [{ field: "type", operator: "eq", value: "item" }],
    optionLabel: "name",
    pagination: {
      mode: "off",
    },
  });

  // --- 自动计算总价 ---
  const handleValuesChange = (_: any, allValues: any) => {
    const items = allValues.items || [];
    const total = items.reduce((sum: number, item: any) => {
      return sum + (item?.quantity || 0) * (item?.unit_cost || 0);
    }, 0);
    setTotalCost(total);
  };

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
    close();
  };

  const handleFinish = (values: any) => {
    const purchaseOrderFormData = {
      supplier_id: values.supplier_id,
      status: values.status,
      total_estimated_cost: totalCost,
      created_by: data.id,
      expected_arrival_date: values.expected_arrival_date,
    };

    itemsRef.current = values.items.map((item: any) => ({
      [item.type === "component" ? "component_id" : "item_id"]:
        item.component_id.value,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      product_name: item.component_id.label,
    }));
    onFinish(purchaseOrderFormData);
  };

  return (
    <>
      <Create
        saveButtonProps={saveButtonProps}
        title="新建进货单 (Nuovo Ordine)"
      >
        <Form
          {...formProps}
          layout="vertical"
          onValuesChange={handleValuesChange}
          onFinish={handleFinish}
        >
          {/* 顶部基础信息 */}
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label={translate("purchase_orders.fields.supplier")}
                name="supplier_id"
                rules={[{ required: true }]}
              >
                <Select
                  {...supplierSelectProps}
                  onSearch={undefined}
                  filterOption={true}
                  optionFilterProp="label"
                  placeholder="选择供应商"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={translate(
                  "purchase_orders.fields.expected_arrival_date",
                )}
                name="expected_arrival_date"
                getValueProps={(value) => ({
                  value: value ? dayjs(value) : "",
                })}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={translate("purchase_orders.fields.status")}
                name="status"
                initialValue="draft"
              >
                <Select
                  options={[
                    { label: "Draft (草稿)", value: "draft" },
                    { label: "Ordered (已下单)", value: "ordered" },
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
                      {/* 选择配件 + 快速新建按钮 */}
                      <Col span={10}>
                        {/* 隐藏字段：用于存储当前行的类型 */}
                        <Form.Item name={[name, "type"]} hidden>
                          <Input />
                        </Form.Item>
                        <Row gutter={8}>
                          {/* 根据当前行的 type 动态渲染 Select */}
                          <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) =>
                              prevValues.items?.[name]?.type !==
                              curValues.items?.[name]?.type
                            }
                          >
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
                                      label="配件名称"
                                      name={[name, "component_id"]}
                                      rules={[
                                        {
                                          required: true,
                                          message: "请选择配件",
                                        },
                                      ]}
                                    >
                                      <Select
                                        {...(rowType === "component"
                                          ? componentSelectProps
                                          : itemSelectProps)}
                                        labelInValue
                                        onSearch={undefined}
                                        filterOption={true}
                                        optionFilterProp="label"
                                        placeholder={
                                          rowType === "component"
                                            ? "搜索维修配件..."
                                            : "搜索前台配件..."
                                        }
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col flex="32px">
                                    {/* 触发弹窗的按钮 */}
                                    <Button
                                      icon={<PlusOutlined />}
                                      type="primary"
                                      ghost
                                      style={{ marginTop: 30 }} // 对齐输入框
                                      onClick={() => {
                                        if (isComponent) {
                                          createModalShow();
                                        } else {
                                          createItemModalShow();
                                        }
                                      }}
                                      title="新建配件"
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
                <Flex align="center" justify="center">
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
      </Create>

      {createModalOpen && (
        <Modal {...createModalProps} destroyOnHidden>
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
                    onSearch={undefined}
                    filterOption={true}
                    optionFilterProp="label"
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
                    onSearch={undefined}
                    filterOption={true}
                    optionFilterProp="label"
                    placeholder="先选品牌"
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
                    onSearch={undefined}
                    filterOption={true}
                    optionFilterProp="label"
                    placeholder={selectedBrand ? "选择机型" : "请先选择品牌"}
                    disabled={!selectedBrand || isModelLoading}
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
              <Select options={QUALITY_OPTIONS} />
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
      )}

      {createItemModalOpen && (
        <Modal {...createItemModalProps} destroyOnHidden>
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
                    onSearch={undefined}
                    filterOption={true}
                    optionFilterProp="label"
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
      )}
    </>
  );
};
