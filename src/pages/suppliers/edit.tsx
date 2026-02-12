import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, DatePicker } from "antd";
import { useTranslate } from "@refinedev/core";
export const SupplierEdit = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps } = useForm();

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={translate("suppliers.fields.id")}
          name={["id"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input readOnly disabled />
        </Form.Item>
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
    </Edit>
  );
};
