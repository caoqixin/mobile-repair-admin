import { Create, useForm } from "@refinedev/antd";
import {
  Form,
  Input,
  Select,
  InputNumber,
  Radio,
  Row,
  Col,
  Divider,
} from "antd";
import { useTranslate } from "@refinedev/core";
import { EuroCircleOutlined } from "@ant-design/icons";
import { ITransaction } from "../../interface";
import { PAYMENT_OPTIONS } from "../../constants";

export const TransactionsCreate = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps } = useForm<ITransaction>({
    redirect: "list",
  });

  return (
    <Create
      title={translate("transactions.titles.create")}
      saveButtonProps={saveButtonProps}
    >
      <Form
        {...formProps}
        layout="vertical"
        initialValues={{
          type: "expense", // 默认是支出
          payment_method: "cash",
          amount: 0,
        }}
      >
        <Row gutter={24}>
          <Col span={12}>
            {/* 1. 类型选择 */}
            <Form.Item
              label={translate("transactions.fields.type")}
              name="type"
              rules={[{ required: true }]}
            >
              <Radio.Group buttonStyle="solid">
                <Radio.Button value="expense">
                  {translate("transactions.options.expense")}
                </Radio.Button>
                <Radio.Button value="income">
                  {translate("transactions.options.income")}
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={12}>
            {/* 2. 支付方式 */}
            <Form.Item
              label={translate("transactions.fields.payment_method")}
              name="payment_method"
              rules={[{ required: true }]}
            >
              <Select
                options={PAYMENT_OPTIONS.map((o) => ({
                  ...o,
                  label: translate(o.label),
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            {/* 3. 金额 */}
            <Form.Item
              label={translate("transactions.fields.amount")}
              name="amount"
              rules={[
                {
                  required: true,
                  message: translate("transactions.rules.amount"),
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                prefix={<EuroCircleOutlined />}
                precision={2}
                min={0}
                size="large"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            {/* 4. 类别 (提供常用选项 + 可手动输入) */}
            <Form.Item
              label={translate("transactions.fields.category")}
              name="category"
              // 将组件输出的数组 ["Salary"] 转换回字符串 "Salary"
              getValueFromEvent={(value) => {
                return Array.isArray(value) ? value[0] : value;
              }}
              rules={[
                {
                  required: true,
                  message: translate("transactions.rules.category"),
                },
              ]}
              help={translate("transactions.help.category")}
            >
              <Select
                mode="tags" // 允许用户手动输入列表里没有的选项
                placeholder={translate("transactions.placeholder.category")}
                options={[
                  {
                    label: translate("transactions.options.rent"),
                    value: translate("transactions.options.rent"),
                  },
                  {
                    label: translate("transactions.options.salary"),
                    value: translate("transactions.options.salary"),
                  },
                  {
                    label: translate("transactions.options.utilities"),
                    value: translate("transactions.options.utilities"),
                  },
                  {
                    label: translate("transactions.options.purchase"),
                    value: translate("transactions.options.purchase"),
                  },
                  {
                    label: translate("transactions.options.refund"),
                    value: translate("transactions.options.refund"),
                  },
                  {
                    label: translate("transactions.options.other"),
                    value: translate("transactions.options.other"),
                  },
                ]}
                maxCount={1} // 限制只能选一个tag，变相实现“可输入的单选”
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* 5. 备注 */}
        <Form.Item
          label={translate("transactions.fields.description")}
          name="description"
        >
          <Input.TextArea
            rows={3}
            placeholder={translate("transactions.placeholder.description")}
          />
        </Form.Item>
      </Form>
    </Create>
  );
};
