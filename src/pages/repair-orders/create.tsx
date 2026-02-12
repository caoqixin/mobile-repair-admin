import { useEffect, useRef, useState } from "react";
import {
  Create,
  useStepsForm,
  useSelect,
  useModalForm,
  SaveButton,
} from "@refinedev/antd";
import { useCreateMany, useGetIdentity } from "@refinedev/core";
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
import { ICustomer, IInventoryComponent, IRepairOrder } from "../../interface";
import { CREATE_REPAIR_STATUS_OPTIONS } from "../../constants";

export const RepairOrderCreate = () => {
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
              label="选择客户 (Cliente)"
              name="customer_id"
              rules={[{ required: true, message: "请选择或新建客户" }]}
            >
              <Select
                {...customerSelectProps}
                options={[
                  ...(newCustomerOption ? [newCustomerOption] : []),
                  ...(customerSelectProps.options || []),
                ]}
                showSearch
                placeholder="搜索姓名或电话..."
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
              新建
            </Button>
          </Col>
        </Row>
        <Divider plain>或</Divider>
        <div style={{ textAlign: "center", color: "#999" }}>
          如果未找到客户，请点击右侧按钮新建
        </div>
      </Card>
    );
  };

  const DeviceForm = () => {
    return (
      <Card variant="borderless">
        <Form.Item
          label="设备型号 (Modello)"
          name="model_id"
          rules={[{ required: true }]}
        >
          <Select
            {...modelSelectProps}
            showSearch
            placeholder="输入型号搜索 (e.g. iPhone 13)"
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
                  添加新机型
                </Button>
              </>
            )}
          />
        </Form.Item>

        <Form.Item label="IMEI / 序列号" name="imei_sn">
          <Input placeholder="扫描或输入 IMEI" size="large" />
        </Form.Item>

        <Form.Item
          label="故障描述 (Problema)"
          name="problem_description"
          rules={[{ required: true }]}
        >
          <Select
            {...faultSelectProps}
            labelInValue
            mode="multiple"
            placeholder="选择故障现象 (可多选)"
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
                  添加新故障类型
                </Button>
              </>
            )}
          />
        </Form.Item>
        {/* 补充备注 */}
        <Form.Item label="补充描述 (备注)" name="additional_notes">
          <Input.TextArea
            rows={2}
            placeholder="例如：客户保留贴膜，后盖有划痕..."
          />
        </Form.Item>
      </Card>
    );
  };

  const PriceAndComponentForm = () => {
    return (
      <Card variant="borderless">
        <Row gutter={24}>
          {/* 🔥 新增：状态选择 */}
          <Col span={24}>
            <Form.Item
              label="初始状态 (Stato Iniziale)"
              name="status"
              initialValue="pending_check"
              rules={[{ required: true }]}
            >
              <Select
                options={CREATE_REPAIR_STATUS_OPTIONS}
                placeholder="选择当前状态"
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
              label="维修价格 (€)"
              name="total_price"
              initialValue={0}
              rules={[{ required: true, message: "请输入维修价格" }]}
              help="默认自动计算配件费，可手动修改包含人工费"
            >
              <InputNumber
                prefix="€"
                style={{ width: "100%" }}
                min={0}
                size="large"
                placeholder="最终向客户收取的金额"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="预收定金 (€)" name="deposit" initialValue={0}>
              <InputNumber
                prefix="€"
                style={{ width: "100%" }}
                min={0}
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">所需配件 (可选)</Divider>
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
                        placeholder="选择配件"
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
                        placeholder="单价"
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
                        placeholder="数量"
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
                添加配件
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
        ?.label || "未知型号";

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
        <Descriptions title="核对维修单信息" bordered column={1}>
          <Descriptions.Item label="客户姓名">
            {customer?.[0]}
          </Descriptions.Item>
          <Descriptions.Item label="联系号码">
            {customer?.[1]}
          </Descriptions.Item>
          <Descriptions.Item label="设备型号">{modelLabel}</Descriptions.Item>
          <Descriptions.Item label="IMEI / SN">
            {values.imei_sn || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="故障描述">
            <Typography.Text strong>{faultLabels}</Typography.Text>
            {values.additional_notes && (
              <div style={{ fontSize: 12, color: "#999" }}>
                备注: {values.additional_notes}
              </div>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="维修费">
            € {values.total_price}
          </Descriptions.Item>
          <Descriptions.Item label="预收定金">
            € {values.deposit}
          </Descriptions.Item>
          <Descriptions.Item label="维修配件">
            {(values.parts || []).length === 0 ? (
              "无"
            ) : (
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {values.parts.map((p: any, idx: number) => {
                  if (!p?.component_id) {
                    return "无";
                  }
                  // 尝试查找配件名
                  const compName =
                    componentSelectProps.options?.find(
                      (o) => o.value === p.component_id,
                    )?.label || "未知配件";
                  return (
                    <li key={idx}>
                      {compName} x {p.quantity} (€{p.unit_price})
                    </li>
                  );
                })}
              </ul>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="维修状态">
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
        title="新建维修单 (Nuova Riparazione)"
        footerButtons={
          <>
            {current > 0 && (
              <Button
                onClick={() => {
                  gotoStep(current - 1);
                }}
                icon={<StepBackwardOutlined />}
              >
                上一步
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
                下一步
              </Button>
            )}
            {current === formList.length - 1 && (
              <SaveButton {...saveButtonProps} />
            )}
          </>
        }
      >
        <Steps {...stepsProps} size="small" style={{ marginBottom: 24 }}>
          <Steps.Step title="客户信息" icon={<UserOutlined />} />
          <Steps.Step title="设备故障" icon={<MobileOutlined />} />
          <Steps.Step title="报价与配件" icon={<DollarOutlined />} />
          <Steps.Step title="核对" icon={<CheckCircleOutlined />} />
        </Steps>

        <Form {...formProps} layout="vertical">
          {formList[current]}
        </Form>
      </Create>
      {/* 新建客户弹窗 */}
      <Modal {...createCustomerModalProps} title="快速新建客户">
        <Form {...createCustomerFormProps} layout="vertical">
          <Form.Item label="姓名" name="full_name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="电话" name="phone">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <Modal {...createModelModalProps} title="新建设备型号">
        <Form {...createModelFormProps} layout="vertical">
          <Form.Item label="型号名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="例如 iPhone 15 Pro" />
          </Form.Item>
          <Form.Item label="品牌" name="brand_id" rules={[{ required: true }]}>
            <Select {...brandSelectProps} showSearch placeholder="选择品牌名" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal {...createFaultModalProps} title="新建故障类型">
        <Form {...createFaultFormProps} layout="vertical">
          <Form.Item label="故障名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="例如 屏幕破碎" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
