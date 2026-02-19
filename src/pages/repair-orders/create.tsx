import { useEffect, useRef, useState } from "react";
import {
  Create,
  useStepsForm,
  useSelect,
  useModalForm,
  SaveButton,
} from "@refinedev/antd";
import { useCreateMany, useGetIdentity, useTranslate } from "@refinedev/core";
import {
  Form,
  Input,
  Select,
  Steps,
  Button,
  Card,
  Row,
  Col,
  InputNumber,
  Divider,
  Modal,
  message,
  Descriptions,
  Typography,
  Space,
  Tag,
} from "antd";
import {
  UserOutlined,
  MobileOutlined,
  DollarOutlined,
  PlusOutlined,
  UserAddOutlined,
  DeleteOutlined,
  StepForwardOutlined,
  StepBackwardOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { ICustomer, IInventoryComponent } from "../../interface";
import { CREATE_REPAIR_STATUS_OPTIONS } from "../../constants";

export const RepairOrderCreate = () => {
  const translate = useTranslate();
  const { data: userData } = useGetIdentity();
  const [newCustomerOption, setNewCustomerOption] = useState<{
    label: string;
    value: string;
  } | null>(null);

  const partsRef = useRef<
    {
      component_id: string;
      quantity: number;
      unit_cost: number;
    }[]
  >([]);
  const { mutate: createParts } = useCreateMany();
  // 步骤表单 Hook
  const {
    current,
    gotoStep,
    stepsProps,
    formProps,
    saveButtonProps,
    onFinish,
  } = useStepsForm({
    resource: "repair_orders",
    redirect: "list",
    submit: (values) => {
      const finalData = {
        customer_id: values.customer_id,
        model_id: values.model_id,
        imei_sn: values.imei_sn,
        problem_description: (
          values.problem_description as unknown as {
            label: string;
            value: number;
          }[]
        )
          .map((option) => option.label)
          .join(","),
        status: values.status,
        total_price: values.total_price,
        deposit: values.deposit,
        technician_id: userData.id,
      };

      if (values.parts) {
        partsRef.current = values.parts as unknown as {
          component_id: string;
          quantity: number;
          unit_cost: number;
        }[];
      }
      onFinish(finalData);
    },
    // 最终提交时的逻辑
    onMutationSuccess: (data) => {
      // 主表创建成功后，如果有选配件，创建子表
      const orderId = data.data.id;
      const parts = partsRef.current || [];
      if (parts.length > 0) {
        const partsData = parts.map((part: any) => ({
          repair_order_id: orderId,
          component_id: part.component_id,
          quantity: part.quantity || 1,
          unit_price: part.unit_price || 0,
        }));
        createParts({
          resource: "repair_order_parts",
          values: partsData,
        });
      }
    },
  });

  // 获取 form 实例 (useStepsForm 返回的 formProps 中包含 form)
  const formInstance = formProps.form;

  // 🔥 监听配件列表的变化
  const parts = Form.useWatch("parts", formInstance);

  // 🔥 自动计算逻辑：当配件变化时，更新 total_price
  useEffect(() => {
    if (!parts) return;

    // 计算配件总额
    const partsSum = parts.reduce((sum: number, part: any) => {
      const price = Number(part?.unit_price) || 0;
      const qty = Number(part?.quantity) || 1;
      return sum + price * qty;
    }, 0);

    // 策略：我们将 Total Price 设置为 配件总额
    // 注意：这意味着如果用户手动加了人工费，再添加新配件，人工费会被重置。
    // 这是"自动计算"的标准行为。店员应在选完配件后，最后确认/修改总价。
    formInstance?.setFieldValue("total_price", partsSum);
  }, [parts, formInstance]);

  // 快速创建客户 Modal Hook
  const {
    modalProps: createCustomerModalProps,
    formProps: createCustomerFormProps,
    show: showCustomerModal,
  } = useModalForm({
    resource: "customers",
    action: "create",
    redirect: false,
    warnWhenUnsavedChanges: false,
    onMutationSuccess: (data) => {
      const newCustomer = data.data;
      // 创建成功后，自动选中新客户
      formProps.form?.setFieldValue("customer_id", data.data.id);

      setNewCustomerOption({
        label: newCustomer.full_name, // 必须对应 optionLabel
        value: newCustomer.id as string, // 必须对应 optionValue
      });
      message.success("客户创建成功并已选中");
    },
  });

  // B. 新建型号 Modal
  const {
    modalProps: createModelModalProps,
    formProps: createModelFormProps,
    show: showModelModal,
  } = useModalForm({
    resource: "models",
    action: "create",
    redirect: false,
    onMutationSuccess: () => {
      message.success("型号创建成功");
    },
  });

  // C. 新建故障 Modal
  const {
    modalProps: createFaultModalProps,
    formProps: createFaultFormProps,
    show: showFaultModal,
  } = useModalForm({
    resource: "faults",
    action: "create",
    redirect: false,
    onMutationSuccess: () => {
      message.success("故障类型创建成功");
    },
  });

  // 客户
  const { selectProps: customerSelectProps } = useSelect<ICustomer>({
    resource: "customers",
    optionLabel: (item) => `${item.full_name}/${item.phone}`,
    optionValue: "id",
    onSearch: (value) => [
      {
        operator: "or",
        value: [
          { field: "full_name", operator: "contains", value },
          { field: "phone", operator: "contains", value },
        ],
      },
    ],
  });

  // 手机型号
  const { selectProps: modelSelectProps } = useSelect({
    resource: "models",
    optionLabel: "name",
    optionValue: "id",
    onSearch: (value) => [{ field: "name", operator: "contains", value }],
    queryOptions: {
      enabled: current === 1,
    },
    pagination: { mode: "off" },
  });

  // 品牌
  const { selectProps: brandSelectProps } = useSelect({
    resource: "brands",
    optionLabel: "name",
    optionValue: "id",
    onSearch: (value) => [{ field: "name", operator: "contains", value }],
    queryOptions: {
      enabled: current === 1,
    },
  });

  // 故障列表
  const { selectProps: faultSelectProps } = useSelect({
    resource: "faults",
    optionLabel: "name",
    optionValue: "id",
    queryOptions: {
      enabled: current === 1,
    },
    pagination: { mode: "off" },
  });

  const { selectProps: componentSelectProps } = useSelect<IInventoryComponent>({
    resource: "inventory_components",
    optionLabel: "name",
    optionValue: "id",
    onSearch: (value) => [{ field: "name", operator: "contains", value }],
    queryOptions: {
      enabled: current === 2,
    },
  });

  const CustomerForm = () => {
    return (
      <Card variant="borderless">
        <Row gutter={16}>
          <Col span={20}>
            <Form.Item
              label={translate("repair_orders.form.customer.select")}
              name="customer_id"
              rules={[
                {
                  required: true,
                  message: translate("repair_orders.form.customer.errMessage"),
                },
              ]}
            >
              <Select
                {...customerSelectProps}
                options={[
                  ...(newCustomerOption ? [newCustomerOption] : []),
                  ...(customerSelectProps.options || []),
                ]}
                showSearch
                placeholder={translate(
                  "repair_orders.form.customer.placeholder",
                )}
                size="large"
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              size="large"
              style={{ marginTop: 29, width: "100%" }}
              onClick={() => showCustomerModal()}
            >
              {translate("repair_orders.form.customer.button")}
            </Button>
          </Col>
        </Row>
        <Divider plain>{translate("repair_orders.form.customer.or")}</Divider>
        <div style={{ textAlign: "center", color: "#999" }}>
          {translate("repair_orders.form.customer.tips")}
        </div>
      </Card>
    );
  };

  const DeviceForm = () => {
    return (
      <Card variant="borderless">
        <Form.Item
          label={translate("repair_orders.form.device.modelName")}
          name="model_id"
          rules={[{ required: true }]}
        >
          <Select
            {...modelSelectProps}
            showSearch
            placeholder={translate(
              "repair_orders.form.device.modelPlaceholder",
            )}
            size="large"
            popupRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: "8px 0" }} />
                <Button
                  type="text"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => showModelModal()}
                >
                  {translate("repair_orders.form.device.newModel")}
                </Button>
              </>
            )}
          />
        </Form.Item>

        <Form.Item
          label={translate("repair_orders.form.device.imei_sn")}
          name="imei_sn"
        >
          <Input
            placeholder={translate("repair_orders.form.device.imeiPlaceholder")}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={translate("repair_orders.form.device.problem")}
          name="problem_description"
          rules={[{ required: true }]}
        >
          <Select
            {...faultSelectProps}
            labelInValue
            mode="multiple"
            placeholder={translate(
              "repair_orders.form.device.problemPlaceholder",
            )}
            size="large"
            onSearch={undefined}
            filterOption={true}
            optionFilterProp="label"
            popupRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: "8px 0" }} />
                <Button
                  type="text"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => showFaultModal()}
                >
                  {translate("repair_orders.form.device.newProblem")}
                </Button>
              </>
            )}
          />
        </Form.Item>
        {/* 补充备注 */}
        <Form.Item
          label={translate("repair_orders.form.device.notes")}
          name="additional_notes"
        >
          <Input.TextArea
            rows={2}
            placeholder={translate(
              "repair_orders.form.device.notesPlaceholder",
            )}
          />
        </Form.Item>
      </Card>
    );
  };

  const PriceAndComponentForm = () => {
    return (
      <Card variant="borderless">
        <Row gutter={24}>
          {/* 状态选择 */}
          <Col span={24}>
            <Form.Item
              label={translate("repair_orders.form.price.status")}
              name="status"
              initialValue="pending_check"
              rules={[{ required: true }]}
            >
              <Select
                options={CREATE_REPAIR_STATUS_OPTIONS}
                placeholder={translate(
                  "repair_orders.form.price.statusPlaceholder",
                )}
                // 可以在这里自定义渲染，带上颜色Tag
                optionRender={(option) => (
                  <Space>
                    {/* 这里简单展示，若要颜色需配合 Tag 组件 */}
                    <Tag color={option.data.color}>{option.label}</Tag>
                  </Space>
                )}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label={translate("repair_orders.form.price.totalPrice")}
              name="total_price"
              initialValue={0}
              rules={[
                {
                  required: true,
                  message: translate("repair_orders.form.price.ruleMessage"),
                },
              ]}
              help={translate("repair_orders.form.price.help")}
            >
              <InputNumber
                prefix="€"
                style={{ width: "100%" }}
                min={0}
                size="large"
                placeholder={translate(
                  "repair_orders.form.price.pricePlaceholder",
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={translate("repair_orders.form.price.deposit")}
              name="deposit"
              initialValue={0}
            >
              <InputNumber
                prefix="€"
                style={{ width: "100%" }}
                min={0}
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">
          {translate("repair_orders.form.price.components")}
        </Divider>
        <Form.List name="parts">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row
                  key={key}
                  gutter={16}
                  align="middle"
                  style={{ marginBottom: 8 }}
                >
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      name={[name, "component_id"]}
                      noStyle
                    >
                      <Select
                        {...componentSelectProps}
                        placeholder={translate(
                          "repair_orders.form.price.component",
                        )}
                        size="large"
                        style={{ width: "100%" }}
                        showSearch
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      {...restField}
                      name={[name, "unit_price"]}
                      noStyle
                    >
                      <InputNumber
                        prefix="€"
                        placeholder={translate(
                          "repair_orders.form.price.price",
                        )}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      {...restField}
                      name={[name, "quantity"]}
                      initialValue={1}
                      noStyle
                    >
                      <InputNumber
                        min={1}
                        placeholder={translate(
                          "repair_orders.form.price.quantity",
                        )}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={2}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  </Col>
                </Row>
              ))}
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
              >
                {translate("repair_orders.form.price.add")}
              </Button>
            </>
          )}
        </Form.List>
      </Card>
    );
  };

  const CheckForm = () => {
    const values = formProps.form?.getFieldsValue(true) || {};

    // 获取 Label 用于显示 (因为 values 里只有 ID)
    const customer = customerSelectProps.options
      ?.find((o) => o.value === values.customer_id)
      ?.label?.toString()
      ?.split("/");

    // 合并 Model Options
    const modelLabel =
      modelSelectProps.options?.find((o) => o.value === values.model_id)
        ?.label || translate("repair_orders.form.check.unknownModel");

    // 处理故障显示
    const faultLabels = (values.problem_description || [])
      .map(
        (problem: any) =>
          faultSelectProps.options?.find((o) => o.value === problem.value)
            ?.label,
      )
      .filter(Boolean)
      .join(", ");

    return (
      <Card variant="borderless">
        <Descriptions
          title={translate("repair_orders.form.check.title")}
          bordered
          column={1}
        >
          <Descriptions.Item
            label={translate("repair_orders.form.check.customerName")}
          >
            {customer?.[0]}
          </Descriptions.Item>
          <Descriptions.Item
            label={translate("repair_orders.form.check.phone")}
          >
            {customer?.[1]}
          </Descriptions.Item>
          <Descriptions.Item
            label={translate("repair_orders.form.check.device")}
          >
            {modelLabel}
          </Descriptions.Item>
          <Descriptions.Item label={translate("repair_orders.form.check.imei")}>
            {values.imei_sn || "-"}
          </Descriptions.Item>
          <Descriptions.Item
            label={translate("repair_orders.form.check.problem")}
          >
            <Typography.Text strong>{faultLabels}</Typography.Text>
            {values.additional_notes && (
              <div style={{ fontSize: 12, color: "#999" }}>
                {translate("repair_orders.form.check.note")}:
                {values.additional_notes}
              </div>
            )}
          </Descriptions.Item>
          <Descriptions.Item
            label={translate("repair_orders.form.check.total_price")}
          >
            € {values.total_price}
          </Descriptions.Item>
          <Descriptions.Item
            label={translate("repair_orders.form.check.deposit")}
          >
            € {values.deposit}
          </Descriptions.Item>
          <Descriptions.Item
            label={translate("repair_orders.form.check.component")}
          >
            {(values.parts || []).length === 0 ? (
              translate("repair_orders.form.check.no")
            ) : (
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {values.parts.map((p: any, idx: number) => {
                  if (!p?.component_id) {
                    return translate("repair_orders.form.check.no");
                  }
                  // 尝试查找配件名
                  const compName =
                    componentSelectProps.options?.find(
                      (o) => o.value === p.component_id,
                    )?.label ||
                    translate("repair_orders.form.check.unkownComponent");
                  return (
                    <li key={idx}>
                      {compName} x {p.quantity} (€ {p.unit_price})
                    </li>
                  );
                })}
              </ul>
            )}
          </Descriptions.Item>
          <Descriptions.Item
            label={translate("repair_orders.form.check.status")}
          >
            {
              CREATE_REPAIR_STATUS_OPTIONS.find(
                (option) => option.value == values?.status,
              )?.label
            }
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  const formList = [
    CustomerForm(),
    DeviceForm(),
    PriceAndComponentForm(),
    CheckForm(),
  ];

  return (
    <>
      <Create
        title={translate("repair_orders.titles.create")}
        footerButtons={
          <>
            {current > 0 && (
              <Button
                onClick={() => {
                  gotoStep(current - 1);
                }}
                icon={<StepBackwardOutlined />}
              >
                {translate("buttons.previous")}
              </Button>
            )}
            {current < formList.length - 1 && (
              <Button
                onClick={() => {
                  gotoStep(current + 1);
                }}
                icon={<StepForwardOutlined />}
                iconPosition="end"
              >
                {translate("buttons.next")}
              </Button>
            )}
            {current === formList.length - 1 && (
              <SaveButton {...saveButtonProps} />
            )}
          </>
        }
      >
        <Steps {...stepsProps} size="small" style={{ marginBottom: 24 }}>
          <Steps.Step
            title={translate("repair_orders.steps.customer")}
            icon={<UserOutlined />}
          />
          <Steps.Step
            title={translate("repair_orders.steps.device")}
            icon={<MobileOutlined />}
          />
          <Steps.Step
            title={translate("repair_orders.steps.price")}
            icon={<DollarOutlined />}
          />
          <Steps.Step
            title={translate("repair_orders.steps.check")}
            icon={<CheckCircleOutlined />}
          />
        </Steps>

        <Form {...formProps} layout="vertical">
          {formList[current]}
        </Form>
      </Create>
      {/* 新建客户弹窗 */}
      <Modal
        {...createCustomerModalProps}
        title={translate("repair_orders.customerModal.title")}
      >
        <Form {...createCustomerFormProps} layout="vertical">
          <Form.Item
            label={translate("repair_orders.customerModal.name")}
            name="full_name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={translate("repair_orders.customerModal.phone")}
            name="phone"
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        {...createModelModalProps}
        title={translate("repair_orders.modelModal.title")}
      >
        <Form {...createModelFormProps} layout="vertical">
          <Form.Item
            label={translate("repair_orders.modelModal.modelName")}
            name="name"
            rules={[{ required: true }]}
          >
            <Input
              placeholder={translate(
                "repair_orders.modelModal.modelPlaceholder",
              )}
            />
          </Form.Item>
          <Form.Item
            label={translate("repair_orders.modelModal.brandName")}
            name="brand_id"
            rules={[{ required: true }]}
          >
            <Select
              {...brandSelectProps}
              showSearch
              placeholder={translate(
                "repair_orders.modelModal.brandPlaceholder",
              )}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        {...createFaultModalProps}
        title={translate("repair_orders.faultModal.title")}
      >
        <Form {...createFaultFormProps} layout="vertical">
          <Form.Item
            label={translate("repair_orders.faultModal.name")}
            name="name"
            rules={[{ required: true }]}
          >
            <Input
              placeholder={translate(
                "repair_orders.faultModal.namePlaceholder",
              )}
            />
          </Form.Item>
          <Form.Item
            label={translate("repair_orders.faultModal.description")}
            name="description"
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
