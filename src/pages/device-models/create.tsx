import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { useNavigation, useTranslate } from "@refinedev/core";

export const DeviceModelCreate = () => {
  const { list } = useNavigation();
  const translate = useTranslate();

  const { formProps, saveButtonProps } = useForm({
    resource: "brands",
    action: "create",
    redirect: false,
    onMutationSuccess: () => {
      list("device_models");
    },
  });

  return (
    <Create
      title={translate("brands.titles.brandCreate")}
      saveButtonProps={saveButtonProps}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={translate("brands.fields.name")}
          name={["name"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};
