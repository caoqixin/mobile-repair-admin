import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Radio } from "antd";
import { useTranslate } from "@refinedev/core";
import { CATEGORY_TYPE_MAP } from "../../constants";
import { CategoryType } from "../../interface";

export const CategoryCreate = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps } = useForm();

  const options = Object.entries(CATEGORY_TYPE_MAP).map(([value, label]) => ({
    label,
    value: value as CategoryType,
  }));

  return (
    <Create
      title={translate("categories.form.create.title")}
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
            options={options}
            optionType="button"
            buttonStyle="solid"
          />
        </Form.Item>
      </Form>
    </Create>
  );
};
