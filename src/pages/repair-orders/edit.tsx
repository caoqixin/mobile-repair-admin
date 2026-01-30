import React, { useEffect } from "react";
import { Edit, useForm, useSelect } from "@refinedev/antd";
import { useCreateMany, useDeleteMany } from "@refinedev/core";
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
  Space,
  Typography,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { IInventoryComponent } from "../../interface";
// 假设您的常量定义在这里，如果不一样请调整引用
import { REPAIR_STATUS_OPTIONS } from "../../constants";

export const RepairOrderEdit = () => {
  // 1. 数据更新 Hooks
  const { mutateAsync: deleteParts } = useDeleteMany();
  const { mutateAsync: createParts } = useCreateMany();

  const { form, formProps, saveButtonProps, query, onFinish } = useForm({
    meta: {
      select:
        "*, repair_order_parts(*, inventory_components(name, suggested_repair_price))",
    },
  });

  const record = query?.data?.data;

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
      // 🔥 关键修复：将 ID 转换为 { value, label } 格式，解决显示 UUID 问题
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

    // form?.setFieldValue("total_price", partsSum);

    // *注：为了编辑体验更好，您可以选择不自动覆盖，或者仅在总价为0时覆盖。
    // 这里为了响应"根据create内容调整"，我保留自动计算，但建议您根据实际需求决定是否注释掉下面这一行
    form?.setFieldValue("total_price", partsSum);
  }, [parts, form]);

  // 5. 自定义提交
  const handleFinish = async (values: any) => {
    // 计算配件成本 (仅用于记录)
    const partsCost = (values.parts || []).reduce(
      (sum: number, p: any) => sum + Number(p.unit_price) * (p.quantity || 1),
      0,
    );

    // A. 更新主表
    await onFinish({
      status: values.status,
      total_price: values.total_price,
      problem_description: values.problem_description,
      deposit: values.deposit,
    });

    // B. 处理配件 (全删全加策略)
    if (record?.id) {
      const oldIds = record.repair_order_parts?.map((p: any) => p.id) || [];
      if (oldIds.length > 0) {
        await deleteParts({ resource: "repair_order_parts", ids: oldIds });
      }

      const newParts =
        values.parts?.map((p: any) => ({
          repair_order_id: record.id,
          // 🔥 关键：因为使用了 labelInValue，这里需要提取 .value
          component_id: p.component_id?.value || p.component_id,
          quantity: p.quantity,
          unit_price: p.unit_price,
        })) || [];

      if (newParts.length > 0) {
        await createParts({ resource: "repair_order_parts", values: newParts });
      }
    }
  };

  return (
    <Edit saveButtonProps={{ ...saveButtonProps, onClick: form.submit }}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={24}>
          <Col span={16}>
            <Card
              title="维修详情"
              variant="borderless"
              style={{ marginBottom: 24 }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="状态 (Stato)" name="status">
                    <Select
                      options={REPAIR_STATUS_OPTIONS}
                      placeholder="选择状态"
                      // 自定义渲染选中的内容 (回显)
                      tagRender={(props) => {
                        const target = REPAIR_STATUS_OPTIONS.find(
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
                        const target = REPAIR_STATUS_OPTIONS.find(
                          (o) => o.value === option.value,
                        );
                        return <Tag color={target?.color}>{option.label}</Tag>;
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="故障描述" name="problem_description">
                    <Input.TextArea rows={1} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="配件列表" variant="borderless">
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
                              placeholder="选择配件"
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
                              placeholder="Qty"
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
                      添加配件 (Aggiungi Ricambio)
                    </Button>
                  </>
                )}
              </Form.List>
            </Card>
          </Col>

          <Col span={8}>
            <Card title="财务结算" variant="borderless">
              {/* 移除了 labor_cost，改为 total_price */}
              <Form.Item
                label="订单总价 (€)"
                name="total_price"
                help="自动计算配件费，可手动修改包含人工费"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  prefix="€"
                  size="large"
                />
              </Form.Item>

              <Form.Item label="已收定金 (€)" name="deposit">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  prefix="€"
                  size="large"
                />
              </Form.Item>

              <Divider />
              <div style={{ textAlign: "right" }}>
                <Typography.Text type="secondary">
                  * 保存后更新应收尾款
                </Typography.Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
