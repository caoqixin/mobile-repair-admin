import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { useNavigation, useParsed, useTranslate } from "@refinedev/core";
export const DeviceModelEdit = () => {
  const { list } = useNavigation();
  const translate = useTranslate();
  const { id } = useParsed();

  const { formProps, saveButtonProps } = useForm({
    resource: "brands",
    action: "edit",
    id,
    redirect: false,
    onMutationSuccess: () => {
      list("device_models");
    },
  });

  return (
    <Edit
      title={translate("brands.form.edit.title")}
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
    </Edit>
  );
};
