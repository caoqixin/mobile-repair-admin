import { Create, useForm } from "@refinedev/antd";
import { Button, Form, Input, Select, Space } from "antd";
import { useNavigation, useNotification, useTranslate } from "@refinedev/core";
import { IProfile, UserRole } from "../../interface";
import { PROFILE_OPTIONS } from "../../constants";
import { usePasswordGenerator } from "../../hooks/usePasswordGenerator";
import { useMemo } from "react";
import { supabaseClient } from "../../providers/supabase-client";
export const ProfileCreate = () => {
  const { list } = useNavigation();
  const translate = useTranslate();
  const { open } = useNotification();
  const { generatePassword } = usePasswordGenerator(12);
  const { formProps, saveButtonProps, form, mutation } = useForm<
    IProfile & { password: string }
  >({
    warnWhenUnsavedChanges: false,
  });

  const handleGenerate = () => {
    const newPwd = generatePassword();
    if (newPwd) {
      form.setFieldValue(["password"], newPwd);
      form.validateFields([["password"]]);
    }
  };

  const options = useMemo(
    () =>
      PROFILE_OPTIONS?.map((o) => ({
        ...o,
        label: translate(o.label as string),
      })),
    [PROFILE_OPTIONS, translate],
  );

  const handleOnFinish = async (values: any) => {
    const formData = {
      email: values.email,
      password: values.password,
      role: values.role,
      full_name: values.full_name,
    };

    const { data, error } = await supabaseClient.functions.invoke(
      "create-user",
      {
        body: formData,
      },
    );

    if (error) {
      open?.({
        message: translate("profiles.form.create.error"),
        description: error.message,
        type: "error",
      });
      return;
    }

    if (data?.success) {
      open?.({
        message: translate("profiles.form.create.success"),
        type: "success",
      });
      list("profiles");
    }
  };
  return (
    <Create
      title={translate("profiles.form.create.title")}
      saveButtonProps={{
        ...saveButtonProps,
      }}
    >
      <Form {...formProps} onFinish={handleOnFinish} layout="vertical">
        <Form.Item
          label={translate("profiles.fields.email")}
          name={["email"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
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
        <Form.Item<UserRole>
          label={translate("profiles.fields.role")}
          name={["role"]}
          rules={[
            {
              required: true,
            },
          ]}
          initialValue={"front_desk"}
        >
          <Select<UserRole> options={options} />
        </Form.Item>
        <Space.Compact style={{ width: "100%" }}>
          <Form.Item
            noStyle
            label={translate("profiles.fields.password")}
            name={["password"]}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Button
            type="primary"
            onClick={handleGenerate}
            disabled={mutation.isPending}
          >
            {translate("buttons.generate")}
          </Button>
        </Space.Compact>
      </Form>
    </Create>
  );
};
