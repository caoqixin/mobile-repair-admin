import { useEffect, useMemo } from "react";
import { Edit, useForm, useSelect } from "@refinedev/antd";
import { useCreateMany, useDeleteMany, useTranslate } from "@refinedev/core";
import {
  Form,
  Input,
  Select,
  Row,
  Col,
  InputNumber,
  Divider,
  Button,
  Card,
  Tag,
  Typography,
  Radio,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { IInventoryComponent } from "../../interface";
// 假设您的常量定义在这里，如果不一样请调整引用
import { PAYMENT_OPTIONS, REPAIR_STATUS_OPTIONS } from "../../constants";
import { deepEqual } from "../../lib/utils";

export const RepairOrderEdit = () => {
  const translate = useTranslate();
  // 1. 数据更新 Hooks
  const { mutateAsync: deleteParts } = useDeleteMany();
  const { mutateAsync: createParts } = useCreateMany();

  const { form, formProps, saveButtonProps, query, onFinish, formLoading } =
    useForm({
      meta: {
        select:
          "*, repair_order_parts(*, inventory_components(name, suggested_repair_price))",
      },
    });

  const record = query?.data?.data;

  const status_options = useMemo(
    () =>
      REPAIR_STATUS_OPTIONS.map((status) => ({
        ...status,
        label: translate(status.label),
      })),
    [REPAIR_STATUS_OPTIONS, translate],
  );

  // 手机型号
  const { selectProps: modelSelectProps } = useSelect({
    resource: "models",
    defaultValue: [record?.model_id],
    optionLabel: "name",
    optionValue: "id",
    onSearch: (value) => [{ field: "name", operator: "contains", value }],
    pagination: { mode: "off" },
  });

  // 获取 Form 实例用于监听
  // 🔥 监听配件变化，实现自动计算总价
  const parts = Form.useWatch("parts", form);

  // 2. Select 数据 (配件)
  const { selectProps: componentSelectProps } = useSelect<IInventoryComponent>({
    resource: "inventory_components",
    optionLabel: "name",
    optionValue: "id",

    onSearch: (value) => [{ field: "name", operator: "contains", value }],
  });

  // 3. 回显数据处理
  useEffect(() => {
    if (record) {
      // 将 ID 转换为 { value, label } 格式，解决显示 UUID 问题
      const formattedParts = record.repair_order_parts?.map((p: any) => ({
        component_id: {
          value: p.component_id,
          label: p.inventory_components?.name, // 回显名称
        },
        quantity: p.quantity,
        unit_price: p.unit_price,
      }));

      form.setFieldsValue({
        ...record,
        parts: formattedParts,
        // 确保 total_price 回显
        total_price: record.total_price,
        deposit: record.deposit,
      });
    }
  }, [record, form]);

  // 4. 自动计算逻辑 (与 Create 页面保持一致)
  useEffect(() => {
    if (parts?.length == 0) {
      return;
    }
    // 只有当 parts 真的发生变化（且不是初始化空值时），才去覆盖 total_price
    // 注意：编辑模式下，这里需要谨慎，避免页面刚加载就覆盖了数据库里原本可能包含人工费的总价
    // 这里我们做一个简单判断：如果 parts 列表被修改过，则触发计算
    if (!parts) return;

    // 计算配件总额
    const partsSum = parts.reduce((sum: number, part: any) => {
      const price = Number(part?.unit_price) || 0;
      const qty = Number(part?.quantity) || 1;
      return sum + price * qty;
    }, 0);

    form?.setFieldValue("total_price", partsSum);
  }, [parts, form]);

  // 5. 自定义提交
  const handleFinish = async (values: any) => {
    // A. 更新主表
    await onFinish({
      status: values.status,
      total_price: values.total_price,
      problem_description: values.problem_description,
      deposit: values.deposit,
      model_id: values.model_id,
    });

    // B. 处理配件 (全删全加策略)
    if (record?.id) {
      const newParts =
        values.parts?.map((p: any) => ({
          repair_order_id: record.id,
          // 🔥 关键：因为使用了 labelInValue，这里需要提取 .value
          component_id: p.component_id?.value || p.component_id,
          quantity: p.quantity,
          unit_price: p.unit_price,
        })) || [];

      const oldParts =
        record.repair_order_parts?.map((p: any) => ({
          repair_order_id: p.repair_order_id,
          component_id: p.component_id?.value || p.component_id,
          quantity: p.quantity,
          unit_price: p.unit_price,
        })) || [];

      // 如果新老配件一致不需要任何操作
      if (!deepEqual(oldParts, newParts)) {
        // 如果不一致
        //1. 删除老的所有配件
        const oldIds = record.repair_order_parts?.map((p: any) => p.id) || [];
        if (oldIds.length > 0) {
          await deleteParts({ resource: "repair_order_parts", ids: oldIds });
        }

        // 2. 添加新的所有配件
        if (newParts.length > 0) {
          await createParts({
            resource: "repair_order_parts",
            values: newParts,
          });
        }
      }
    }
  };

  return (
    <Edit
      title={translate("repair_orders.titles.edit", {
        id: record?.readable_id,
      })}
      isLoading={formLoading}
      saveButtonProps={{ ...saveButtonProps, onClick: form.submit }}
    >
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={24}>
          <Col span={16}>
            <Card
              title={translate("repair_orders.form.edit.repair_info")}
              variant="borderless"
              style={{ marginBottom: 24 }}
            >
              <Row gutter={16}>
                <Col span={24}>
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
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={translate("repair_orders.form.price.status")}
                    name="status"
                  >
                    <Select
                      options={status_options}
                      placeholder={translate(
                        "repair_orders.form.price.statusPlaceholder",
                      )}
                      // 自定义渲染选中的内容 (回显)
                      tagRender={(props) => {
                        const target = status_options.find(
                          (o) => o.value === props.value,
                        );
                        return (
                          <Tag color={target?.color} style={{ marginRight: 3 }}>
                            {props.label}
                          </Tag>
                        );
                      }}
                      // 自定义下拉菜单选项
                      optionRender={(option) => {
                        const target = status_options.find(
                          (o) => o.value === option.value,
                        );
                        return <Tag color={target?.color}>{option.label}</Tag>;
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={translate("repair_orders.form.device.problem")}
                    name="problem_description"
                  >
                    <Input.TextArea rows={1} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              title={translate("repair_orders.form.edit.component_list")}
              variant="borderless"
            >
              <Form.List name="parts">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row
                        key={key}
                        gutter={16}
                        align="middle"
                        style={{ marginBottom: 12 }}
                      >
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, "component_id"]}
                            noStyle
                          >
                            <Select
                              {...componentSelectProps}
                              labelInValue // 🔥 开启此项以支持对象格式的值
                              placeholder={translate(
                                "repair_orders.form.price.component",
                              )}
                              showSearch
                              style={{ width: "100%" }}
                              filterOption={false} // 配合 onSearch 使用
                              onSearch={componentSelectProps.onSearch}
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
          </Col>

          <Col span={8}>
            <Card
              title={translate("repair_orders.form.edit.checkout")}
              variant="borderless"
            >
              <Form.Item
                label={translate("repair_orders.form.edit.total_price")}
                name="total_price"
                help={translate("repair_orders.form.edit.help")}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  prefix="€"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label={translate("repair_orders.form.edit.deposit")}
                name="deposit"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  prefix="€"
                  size="large"
                />
              </Form.Item>

              {record?.status === "completed" && (
                <Form.Item
                  label={translate("repair_orders.form.edit.payment_method")}
                  name="payment_method"
                  initialValue="cash"
                >
                  <Radio.Group buttonStyle="solid">
                    {PAYMENT_OPTIONS.map((o) => (
                      <Radio.Button key={o.value} value={o.value}>
                        {translate(o.label)}
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </Form.Item>
              )}

              <Divider />
              <div style={{ textAlign: "right" }}>
                <Typography.Text type="secondary">
                  {translate("repair_orders.form.edit.tips")}
                </Typography.Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
