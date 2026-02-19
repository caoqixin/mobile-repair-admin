import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { useNavigation, useParsed, useTranslate } from "@refinedev/core";
import { IBrand } from "../../interface";
export const DeviceModelEdit = () => {
  const { list } = useNavigation();
  const translate = useTranslate();
  const { id } = useParsed();

  const { formProps, saveButtonProps, formLoading, query } = useForm<IBrand>({
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
      isLoading={formLoading}
      title={translate("brands.titles.brandEdit", {
        name: query?.data?.data.name,
      })}
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
