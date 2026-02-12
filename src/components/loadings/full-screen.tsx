import React from "react";
import { Spin, Typography } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import { BRAND_COLOR } from "../../constants";

export const FullScreenLoading: React.FC = () => {
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        // 默认背景色，避免闪烁。如果你的系统默认是深色，这里可以改为 #141414
        backgroundColor: "#f5f5f5",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
    >
      {/* 品牌 Logo 区域 */}
      <div
        style={{
          marginBottom: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            background: "#fff",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            marginBottom: 16,
          }}
        >
          <ThunderboltOutlined style={{ fontSize: 36, color: BRAND_COLOR }} />
        </div>

        <Typography.Title
          level={4}
          style={{ margin: 0, color: "#595959", fontWeight: 600 }}
        >
          {import.meta.env.VITE_APP_NAME}
        </Typography.Title>
      </div>

      {/* 加载动画 */}
      <Spin size="large" style={{ color: BRAND_COLOR }} />

      {/* 底部版权 (可选) */}
      <div style={{ position: "absolute", bottom: 32, opacity: 0.4 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Powered by {import.meta.env.VITE_APP_STORE_NAME}
        </Typography.Text>
      </div>
    </div>
  );
};
