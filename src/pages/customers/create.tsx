import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { useTranslate } from "@refinedev/core";

export const CustomerCreate = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create
      title={translate("customers.form.create.title")}
      saveButtonProps={saveButtonProps}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={translate("customers.fields.full_name")}
          name={["full_name"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={translate("customers.fields.phone")}
          name={["phone"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item label={translate("customers.fields.email")} name={["email"]}>
          <Input />
        </Form.Item>
        <Form.Item label={translate("customers.fields.notes")} name={["notes"]}>
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};
