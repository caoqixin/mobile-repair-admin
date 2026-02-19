import { Edit, useForm } from "@refinedev/antd";
import { useTranslate } from "@refinedev/core";
import { Form, Input } from "antd";
import { ICustomer } from "../../interface";

export const CustomerEdit = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps, query, formLoading } =
    useForm<ICustomer>();

  return (
    <Edit
      isLoading={formLoading}
      saveButtonProps={saveButtonProps}
      title={translate("customers.titles.edit", {
        name: query?.data?.data.full_name,
      })}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={translate("customers.fields.id")}
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
    </Edit>
  );
};
