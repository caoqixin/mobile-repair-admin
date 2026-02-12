import React from "react";
import { Spin } from "antd";

export const LayoutLoading: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%", // 占满父容器高度
        minHeight: "300px",
        width: "100%",
      }}
    >
      <Spin size="large" />
    </div>
  );
};
