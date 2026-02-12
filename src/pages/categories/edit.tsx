import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Radio } from "antd";
import { useTranslate } from "@refinedev/core";
import { CATEGORY_OPTIONS } from "../../constants";

export const CategoryEdit = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps, formLoading } = useForm();

  return (
    <Edit
      isLoading={formLoading}
      title={translate("categories.form.edit.title")}
      saveButtonProps={saveButtonProps}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={translate("categories.fields.id")}
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
          label={translate("categories.fields.name")}
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
          label={translate("categories.fields.type")}
          name={["type"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Radio.Group
            defaultValue={"component"}
            options={CATEGORY_OPTIONS}
            optionType="button"
            buttonStyle="solid"
          />
        </Form.Item>
      </Form>
    </Edit>
  );
};
