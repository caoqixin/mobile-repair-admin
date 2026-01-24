import { Create, useForm } from "@refinedev/antd";
import { Form, Input, notification, Select } from "antd";
import { useNavigation, useTranslate } from "@refinedev/core";
import { IProfile, UserRole } from "../../interface";
import { USER_ROLE_MAP } from "../../constants";
import { supabaseClient } from "../../providers/supabase-client";
export const ProfileCreate = () => {
  const { list } = useNavigation();
  const translate = useTranslate();
  const { formProps, saveButtonProps, form } = useForm<IProfile>({
    warnWhenUnsavedChanges: false,
  });

  const options = Object.entries(USER_ROLE_MAP).map(([value, label]) => ({
    label,
    value: value as UserRole,
  }));

  const handleOnFinish = async (values: any) => {
    try {
      //  获取当前管理员的 Session Token
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        throw new Error("管理员未登录或会话已过期");
      }

      // 执行邀请逻辑
      const { data, error } = await supabaseClient.functions.invoke(
        "invite-user",
        {
          body: {
            email: values.email,
            full_name: values.full_name,
            role: values.role,
            redirectTo: `${window.location.origin}/update-password`,
          },
          headers: {
            // 强制指定 Token，确保万无一失
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (error) {
        // 解析详细的错误信息
        let errorMessage = "邀请失败";
        try {
          // 尝试解析 Edge Function 返回的 JSON 错误
          const errorBody =
            typeof error === "string" ? JSON.parse(error) : error;
          // 如果 error 是对象且有 context (Refine/Supabase 封装)，尝试读取
          if (error.context) {
            const contextJson = await error.context.json();
            errorMessage = contextJson.error || errorMessage;
          } else {
            errorMessage = errorBody.message || errorBody.error || errorMessage;
          }
        } catch (e) {
          console.error("解析错误失败", e);
        }

        throw new Error(errorMessage);
      }

      notification.success({
        message: "邀请发送成功",
        description: `已向 ${values.email} 发送设置密码的邮件。`,
      });

      list("profiles");
    } catch (error: any) {
      notification.error({
        message: "操作失败",
        description: error.message || "请检查权限或邮件配置",
      });
    }
  };
  return (
    <Create
      title={translate("profiles.form.create.title")}
      saveButtonProps={{
        ...saveButtonProps,
        onClick: () => form.submit(), // 强制触发 form 的提交
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
        <Form.Item
          label={translate("profiles.fields.role")}
          name={["role"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select<UserRole> options={options} defaultValue={"front_desk"} />
        </Form.Item>
      </Form>
    </Create>
  );
};
