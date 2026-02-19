import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { useTranslate } from "@refinedev/core";
import { ISupplier } from "../../interface";
export const SupplierEdit = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps, query } = useForm<ISupplier>();

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      title={translate("suppliers.titles.edit", {
        name: query?.data?.data.name,
      })}
    >
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
