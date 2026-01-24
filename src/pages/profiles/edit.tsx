import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import { useTranslate } from "@refinedev/core";
import { IProfile, UserRole } from "../../interface";
import { USER_ROLE_MAP } from "../../constants";

export const ProfileEdit = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps } = useForm<IProfile>({
    warnWhenUnsavedChanges: true,
  });

  const options = Object.entries(USER_ROLE_MAP).map(([value, label]) => ({
    label,
    value: value as UserRole,
  }));

  return (
    <Edit
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
          rules={[
            {
              required: true,
            },
          ]}
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
          <Select options={options} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
