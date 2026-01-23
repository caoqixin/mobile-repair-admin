import { Edit, useForm } from "@refinedev/antd";
import { AntdEditInferencer } from "@refinedev/inferencer/antd";
import { Form, Input } from "antd";

export const CustomerEdit = () => {
  const { formProps, saveButtonProps } = useForm({});

  return <AntdEditInferencer />;
};
