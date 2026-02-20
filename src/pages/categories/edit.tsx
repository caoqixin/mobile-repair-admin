import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Radio } from "antd";
import { useTranslate } from "@refinedev/core";
import { CATEGORY_OPTIONS } from "../../constants";
import { ICategory } from "../../interface";
import { useMemo } from "react";

export const CategoryEdit = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps, formLoading, query } =
    useForm<ICategory>();

  const options = useMemo(
    () =>
      CATEGORY_OPTIONS.map((o) => ({
        ...o,
        label: translate(o.label as string),
      })),
    [CATEGORY_OPTIONS, translate],
  );
  return (
    <Edit
      isLoading={formLoading}
      title={translate("categories.titles.edit", {
        name: query?.data?.data.name,
      })}
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
            options={options}
            optionType="button"
            buttonStyle="solid"
          />
        </Form.Item>
      </Form>
    </Edit>
  );
};
