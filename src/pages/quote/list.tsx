import React, { useState } from "react";
import { useTable, useSelect } from "@refinedev/antd";
import {
  Table,
  Card,
  Select,
  Typography,
  Tag,
  Space,
  Button,
  message,
  Tooltip,
  Empty,
} from "antd";
import {
  SearchOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useTranslate } from "@refinedev/core";
import { formatCurrency } from "../../lib/utils";

const { Title, Text } = Typography;

export const Quote = () => {
  const translate = useTranslate();
  // --- 状态管理 ---
  const [selectedModel, setSelectedModel] = useState<number | null>(null);

  const [isSearchEnabled, setIsSearchEnabled] = useState(false);

  // --- 1. 模型搜索 (Select) ---
  // 直接搜索 models 表
  const { selectProps: modelSelectProps } = useSelect({
    resource: "models",
    optionLabel: "name",
    optionValue: "id",
    onSearch: (value) => {
      if (value && value.trim().length > 0) {
        setIsSearchEnabled(true); // 开启请求
        return [
          {
            field: "name",
            operator: "contains",
            value,
          },
        ];
      } else {
        setIsSearchEnabled(false); // 关闭请求
        return [];
      }
    },
    queryOptions: {
      enabled: isSearchEnabled, // false 时完全不发网络请求
    },
  });

  // --- 2. 获取报价列表 (Table) ---
  // 策略：查询中间表 component_compatibility
  // 筛选：model_id = 选中的型号
  // 关联：展开 inventory_components 获取配件详情
  const {
    tableProps,
    tableQuery: { isLoading },
  } = useTable({
    resource: "component_compatibility",
    syncWithLocation: false,
    pagination: { mode: "off" }, // 报价列表不分页
    filters: {
      permanent: [
        {
          field: "model_id",
          operator: "eq",
          value: selectedModel || -1, // 未选中时传无效ID避免查出数据
        },
      ],
    },
    meta: {
      // 🔥 核心：通过 Supabase 关联查询，把配件详情拉出来
      select: "*, inventory_components(*)",
    },
    queryOptions: {
      enabled: !!selectedModel, // 只有选了型号才发请求
    },
  });

  // --- 交互逻辑 ---

  // 复制报价文本
  const handleCopyQuote = (record: any) => {
    // 注意：数据层级变了，配件信息在 record.inventory_components 里
    const comp = record.inventory_components;
    if (!comp) return;

    const text = `${comp.name} (${comp.quality}): €${comp.suggested_repair_price}`;
    navigator.clipboard.writeText(text);
    message.success("报价已复制 (Copiato)!");
  };

  return (
    <div style={{ padding: 12, maxWidth: 1000, margin: "0 auto" }}>
      <Card variant="borderless" className="shadow-sm">
        {/* 顶部极简搜索区 */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Title level={3} style={{ marginBottom: 8 }}>
            <ThunderboltOutlined style={{ color: "#faad14" }} />{" "}
            {translate("quote.title")}
          </Title>
          <Text type="secondary">{translate("quote.description")}</Text>
        </div>

        <div style={{ maxWidth: 500, margin: "0 auto 32px" }}>
          <Select
            {...modelSelectProps}
            showSearch
            placeholder={translate("quote.placeholder")}
            size="large"
            style={{ width: "100%" }}
            filterOption={false}
            suffixIcon={<SearchOutlined />}
            onChange={(val) => setSelectedModel(val as unknown as number)}
            notFoundContent={null}
            autoFocus
          />
        </div>

        {/* 结果展示区 */}
        {!selectedModel ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={translate("quote.pendingSearch")}
            style={{ color: "#999" }}
          />
        ) : (
          <Table
            {...tableProps}
            rowKey="id"
            pagination={false}
            size="middle"
            loading={isLoading}
            locale={{ emptyText: translate("quote.emptyResult") }}
          >
            {/* 配件名称 */}
            <Table.Column
              title={translate("quote.fields.name")}
              render={(_, record: any) => {
                const comp = record.inventory_components;
                return (
                  <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: 16 }}>
                      {comp?.name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {comp?.sku}
                    </Text>
                    <Tag
                      color={comp?.quality === "originale" ? "gold" : "blue"}
                    >
                      {comp?.quality?.toUpperCase()}
                    </Tag>
                  </Space>
                );
              }}
            />

            {/* 库存状态 */}
            <Table.Column
              title={translate("quote.fields.quantity")}
              align="center"
              width={100}
              render={(_, record: any) => {
                const stock = record.inventory_components?.stock_quantity || 0;
                return stock > 0 ? (
                  <Tag
                    color="success"
                    style={{ width: "100%", textAlign: "center" }}
                  >
                    <CheckCircleOutlined /> {translate("quote.fields.inStock")}(
                    {stock})
                  </Tag>
                ) : (
                  <Tag
                    color="error"
                    style={{ width: "100%", textAlign: "center" }}
                  >
                    <CloseCircleOutlined /> {translate("quote.fields.outStock")}
                  </Tag>
                );
              }}
            />

            {/* 维修报价 (重点) */}
            <Table.Column
              title={translate("quote.fields.retail_price")}
              align="right"
              render={(_, record: any) => (
                <Text strong style={{ fontSize: 20, color: "#3f8600" }}>
                  {formatCurrency(
                    record.inventory_components?.suggested_repair_price,
                  )}
                </Text>
              )}
            />

            {/* 同行价 (隐蔽) */}
            <Table.Column
              title={translate("quote.fields.collabor_price")}
              align="right"
              responsive={["sm"]}
              render={(_, record: any) => (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {formatCurrency(
                    record.inventory_components?.partner_repair_price,
                  )}
                </Text>
              )}
            />

            {/* 操作 */}
            <Table.Column
              title={translate("table.actions")}
              align="center"
              width={80}
              render={(_, record: any) => (
                <Tooltip title="复制报价">
                  <Button
                    type="dashed"
                    shape="circle"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyQuote(record)}
                  />
                </Tooltip>
              )}
            />
          </Table>
        )}
      </Card>
    </div>
  );
};
