import { Show, TextField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { AntdShowInferencer } from "@refinedev/inferencer/antd";
import { Typography } from "antd";

const { Title } = Typography;

export const CustomerShow = () => {
  return <AntdShowInferencer />;
};
