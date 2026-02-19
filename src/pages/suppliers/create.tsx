import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { useTranslate } from "@refinedev/core";

export const SupplierCreate = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create
      saveButtonProps={saveButtonProps}
      title={translate("suppliers.titles.create")}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={translate("suppliers.fields.name")}
          name={["name"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={translate("suppliers.fields.website")}
          name={["website"]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={translate("suppliers.fields.description")}
          name={["description"]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};
