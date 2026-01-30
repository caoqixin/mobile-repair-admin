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

export const TransactionsCreate = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps } = useForm<ITransaction>({
    redirect: "list",
  });

  return (
    <Create
      title={translate("transactions.title")}
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
                <Radio.Button value="expense">支出 (Expense)</Radio.Button>
                <Radio.Button value="income">收入 (Income)</Radio.Button>
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
                options={[
                  { label: "现金 (Cash)", value: "cash" },
                  { label: "刷卡 (Card)", value: "card" },
                  { label: "银行转账 (Transfer)", value: "transfer" },
                ]}
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
              rules={[{ required: true, message: "请输入金额" }]}
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
              rules={[{ required: true, message: "请选择或输入类别" }]}
              help="例如：Rent (房租), Salary (工资), Utilities (水电), Food (餐费)"
            >
              <Select
                mode="tags" // 允许用户手动输入列表里没有的选项
                placeholder="选择或输入类别"
                options={[
                  { label: "房租 (Rent)", value: "Rent" },
                  { label: "员工工资 (Salary)", value: "Salary" },
                  { label: "水电网费 (Utilities)", value: "Utilities" },
                  { label: "采购 (Purchase)", value: "Purchase" },
                  { label: "退款 (Refund)", value: "Refund" },
                  { label: "其它 (Other)", value: "Other" },
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
          <Input.TextArea rows={3} placeholder="备注详情，例如：1月份电费" />
        </Form.Item>
      </Form>
    </Create>
  );
};
