import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Radio } from "antd";
import { useTranslate } from "@refinedev/core";
import { CATEGORY_OPTIONS } from "../../constants";

export const CategoryCreate = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create
      title={translate("categories.titles.create")}
      saveButtonProps={saveButtonProps}
    >
      <Form {...formProps} layout="vertical">
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
    </Create>
  );
};
