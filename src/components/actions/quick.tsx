import React, { useState } from "react";
import { useNavigation } from "@refinedev/core";
import { Button, Tooltip, Space, Card, Typography } from "antd";
import {
  PlusCircleOutlined,
  ShoppingOutlined,
  ToolOutlined,
  ScanOutlined,
  ThunderboltOutlined,
  ImportOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  RightOutlined,
  LeftOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export const QuickActionsWidget = () => {
  const { create, list } = useNavigation();
  const [isExpanded, setIsExpanded] = useState(false);

  // 动作配置列表
  const actions = [
    {
      label: "新建维修",
      sub: "New Repair",
      icon: <PlusCircleOutlined style={{ fontSize: 20, color: "#1890ff" }} />,
      onClick: () => create("repair_orders"),
    },
    {
      label: "零售收银",
      sub: "POS",
      icon: <ShoppingOutlined style={{ fontSize: 20, color: "#52c41a" }} />,
      onClick: () => create("sales_orders"), // 假设这是销售单路由
    },
    {
      label: "配件查询",
      sub: "Parts",
      icon: <ToolOutlined style={{ fontSize: 20, color: "#722ed1" }} />,
      onClick: () => list("inventory_components"),
    },
    {
      label: "商品查询",
      sub: "Retail",
      icon: <ScanOutlined style={{ fontSize: 20, color: "#eb2f96" }} />,
      onClick: () => list("inventory_items"),
    },
    {
      label: "极速报价",
      sub: "Quote",
      icon: <ThunderboltOutlined style={{ fontSize: 20, color: "#faad14" }} />,
      onClick: () => list("quote"),
    },
    {
      label: "进货入库",
      sub: "Purchase",
      icon: <ImportOutlined style={{ fontSize: 20, color: "#13c2c2" }} />,
      onClick: () => create("stock_entries"),
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* 主面板 */}
      <div
        style={{
          width: isExpanded ? 220 : 0,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "4px 0 12px rgba(0,0,0,0.15)",
          borderTopRightRadius: 16,
          borderBottomRightRadius: 16,
          transition: "width 0.3s cubic-bezier(0.2, 0, 0, 1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px 12px",
            background: "#f9f9f9",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Text strong>快速操作</Text>
        </div>

        <div
          style={{
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {actions.map((act, idx) => (
            <Button
              key={idx}
              type="text"
              style={{
                height: 56,
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                background: "#fff",
                border: "1px solid #f0f0f0",
                borderRadius: 8,
              }}
              onClick={act.onClick}
            >
              <Space size={12}>
                {act.icon}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    lineHeight: 1.2,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{act.label}</span>
                  <span style={{ fontSize: 10, color: "#999" }}>{act.sub}</span>
                </div>
              </Space>
            </Button>
          ))}
        </div>
      </div>

      {/* 开关按钮 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: 24,
          height: 48,
          background: "#1890ff",
          borderTopLeftRadius: 24,
          borderBottomLeftRadius: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "2px 0 8px rgba(24, 144, 255, 0.3)",
          marginRight: -1, // 消除缝隙
        }}
      >
        {isExpanded ? (
          <RightOutlined style={{ color: "#fff", fontSize: 12 }} />
        ) : (
          <LeftOutlined style={{ color: "#fff", fontSize: 12 }} />
        )}
      </div>
    </div>
  );
};
