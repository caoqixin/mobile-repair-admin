import React from "react";
import { Result, Button, Space, Typography, Spin } from "antd";
import { useNavigation, usePermissions, useTranslate } from "@refinedev/core";
import { HomeOutlined } from "@ant-design/icons";
import { ROLE_BASE_HOME_MAP } from "../../constants";
import { UserRole } from "../../interface";

export const AccessDenied: React.FC = () => {
  const translate = useTranslate();
  const { list } = useNavigation(); // 用于跳转首页
  const { data, isLoading } = usePermissions({});

  if (isLoading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  const role = data?.role as UserRole;

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5", // 浅灰背景，更柔和
      }}
    >
      <Result
        status="403"
        title="403"
        subTitle={
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Typography.Text strong style={{ fontSize: "16px" }}>
              {translate("pages.authorization.title")}
            </Typography.Text>
            <Typography.Text type="secondary">
              {translate("pages.authorization.description")}
            </Typography.Text>
          </div>
        }
        extra={
          <Space size="middle">
            {/* 回到首页按钮 */}
            {!isLoading && (
              <Button
                type="primary"
                icon={<HomeOutlined />}
                onClick={() =>
                  list(ROLE_BASE_HOME_MAP[role].resources, "replace")
                }
              >
                {translate("pages.authorization.backHome")}
              </Button>
            )}
          </Space>
        }
      />
    </div>
  );
};
