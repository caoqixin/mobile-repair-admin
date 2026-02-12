import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import { useTranslate } from "@refinedev/core";
import { IProfile } from "../../interface";
import { PROFILE_OPTIONS } from "../../constants";

export const ProfileEdit = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps, formLoading } = useForm<IProfile>({
    warnWhenUnsavedChanges: true,
  });

  return (
    <Edit
      isLoading={formLoading}
      title={translate("profiles.form.edit.title")}
      saveButtonProps={saveButtonProps}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={translate("profiles.fields.id")}
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
          label={translate("profiles.fields.email")}
          name={["email"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input disabled />
        </Form.Item>
        <Form.Item
          label={translate("profiles.fields.full_name")}
          name={["full_name"]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={translate("profiles.fields.role")}
          name={["role"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select options={PROFILE_OPTIONS} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
