import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { useTranslate } from "@refinedev/core";
import { IFault } from "../../interface";
export const FaultEdit = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps, formLoading, query } = useForm<IFault>();

  return (
    <Edit
      isLoading={formLoading}
      title={translate("faults.titles.edit", { name: query?.data?.data.name })}
      saveButtonProps={saveButtonProps}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={translate("faults.fields.id")}
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
          label={translate("faults.fields.name")}
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
          label={translate("faults.fields.description")}
          name={["description"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Edit>
  );
};
