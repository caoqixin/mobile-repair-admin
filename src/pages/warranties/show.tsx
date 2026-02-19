import React, { useRef, useState } from "react";
import { useShow, useTranslate } from "@refinedev/core";
import { useTranslation as usei18nextTranslation } from "react-i18next";
import { Show, DateField } from "@refinedev/antd";
import {
  Typography,
  Divider,
  Button,
  Row,
  Col,
  Tag,
  Flex,
  Space,
  Badge,
} from "antd";
import {
  PrinterOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  MobileOutlined,
  CalendarOutlined,
  TranslationOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useReactToPrint } from "react-to-print";

const { Title, Text, Paragraph } = Typography;

export const WarrantyShow = () => {
  const translate = useTranslate();
  const { i18n } = usei18nextTranslation();
  const currentLocale = i18n.language;

  // 控制是否显示中文，默认 false (仅显示意大利语)
  const [showChinese, setShowChinese] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  const { query } = useShow({
    meta: {
      select:
        "*, repair_orders!warranties_repair_order_id_fkey(readable_id, problem_description, models(name)),  customers(full_name, phone, email)",
    },
  });
  const { data, isLoading } = query;
  const record = data?.data;

  // 判断是否在保
  const isExpired = record ? dayjs().isAfter(dayjs(record.end_date)) : false;

  // 双语渲染辅助函数
  const renderBilingual = (it: string, zh: string, isBlock = false) => {
    if (!showChinese) return <>{it}</>;
    if (isBlock) {
      return (
        <div style={{ textAlign: "inherit" }}>
          <div>{it}</div>
          <div
            style={{
              fontSize: "0.85em",
              color: "#8c8c8c",
              fontWeight: "normal",
              marginTop: 2,
            }}
          >
            {zh}
          </div>
        </div>
      );
    }
    return (
      <>
        {it} <span style={{ fontSize: "0.9em", color: "#8c8c8c" }}>({zh})</span>
      </>
    );
  };

  // 状态配置项 (支持双语)
  let statusConfig = {
    color: "green",
    textIt: "ATTIVO",
    textZh: "生效中",
    bg: "#f6ffed",
    border: "#b7eb8f",
  };
  if (record?.status === "void") {
    statusConfig = {
      color: "red",
      textIt: "ANNULLATO",
      textZh: "已作废",
      bg: "#fff2f0",
      border: "#ffccc7",
    };
  } else if (isExpired) {
    statusConfig = {
      color: "orange",
      textIt: "SCADUTO",
      textZh: "已过期",
      bg: "#fffbe6",
      border: "#ffe58f",
    };
  }

  return (
    <Show
      isLoading={isLoading}
      title={translate("warranty.titles.show", { id: record?.readable_id })}
      headerButtons={({ defaultButtons }) => (
        <>
          {/* 添加中文切换按钮 */}
          {currentLocale === "zh" && (
            <Button
              onClick={() => setShowChinese(!showChinese)}
              icon={<TranslationOutlined />}
            >
              {showChinese ? "隐藏中文" : "添加中文"}
            </Button>
          )}
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={reactToPrintFn}
          >
            {translate("warranty.text.print")}
          </Button>
          {defaultButtons}
        </>
      )}
    >
      <div style={{ padding: "24px 0" }}>
        {/* 打印区域外层包裹 */}
        <div
          ref={contentRef}
          style={{
            maxWidth: 800,
            margin: "0 auto",
            backgroundColor: "#fff",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
            overflow: "hidden",
            position: "relative",
          }}
          className="print-area"
        >
          {/* 状态角标 (右上角丝带效果) */}
          <Badge.Ribbon
            text={
              <span style={{ fontWeight: 600, letterSpacing: 1 }}>
                {renderBilingual(statusConfig.textIt, statusConfig.textZh)}
              </span>
            }
            color={statusConfig.color}
            style={{ padding: "0 16px", top: 16 }}
          >
            <div style={{ padding: "48px 48px 32px 48px" }}>
              {/* --- Header 区域 --- */}
              <Flex vertical align="center" style={{ marginBottom: 48 }}>
                <SafetyCertificateOutlined
                  style={{
                    fontSize: 56,
                    color:
                      record?.status === "void" || isExpired
                        ? "#d9d9d9"
                        : "#3f8600",
                    marginBottom: 16,
                  }}
                />
                <Title
                  level={2}
                  style={{ margin: 0, letterSpacing: 2, textAlign: "center" }}
                >
                  {renderBilingual("Certificato di Garanzia", "保修证书", true)}
                </Title>
                <Text type="secondary" style={{ marginTop: 16 }}>
                  N. <Text strong>{record?.readable_id}</Text>
                </Text>
              </Flex>

              {/* --- 核心信息区 --- */}
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <div
                    style={{
                      backgroundColor: "#f8f9fa",
                      padding: 20,
                      borderRadius: 8,
                      height: "100%",
                    }}
                  >
                    <Space style={{ marginBottom: 12, color: "#8c8c8c" }}>
                      <UserOutlined />
                      <Text type="secondary" strong>
                        {renderBilingual("Informazioni Cliente", "客户信息")}
                      </Text>
                    </Space>
                    <div style={{ fontSize: 16 }}>
                      <Text
                        strong
                        style={{
                          display: "block",
                          fontSize: 18,
                          marginBottom: 4,
                        }}
                      >
                        {record?.customers?.full_name || "-"}
                      </Text>
                      <Text type="secondary">
                        {record?.customers?.phone || "-"}
                      </Text>
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div
                    style={{
                      backgroundColor: "#f8f9fa",
                      padding: 20,
                      borderRadius: 8,
                      height: "100%",
                    }}
                  >
                    <Space style={{ marginBottom: 12, color: "#8c8c8c" }}>
                      <MobileOutlined />
                      <Text type="secondary" strong>
                        {renderBilingual(
                          "Dispositivo in Riparazione",
                          "维修设备",
                        )}
                      </Text>
                    </Space>
                    <div>
                      <Text strong style={{ fontSize: 16 }}>
                        {record?.repair_orders?.models?.name ||
                          renderBilingual(
                            "Dispositivo Sconosciuto",
                            "未知设备",
                          )}
                      </Text>
                      <div style={{ marginTop: 8 }}>
                        <Text
                          type="secondary"
                          style={{ fontSize: 13, display: "block" }}
                        >
                          {renderBilingual("Ordine Associato:", "关联单号:")}{" "}
                          {record?.repair_orders?.readable_id || "-"}
                        </Text>
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 13,
                            display: "block",
                            marginTop: 4,
                          }}
                        >
                          {renderBilingual(
                            "Dettagli Riparazione:",
                            "维修内容:",
                          )}{" "}
                          {record?.repair_orders?.problem_description || "-"}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* --- 期限信息区 --- */}
              <div
                style={{
                  marginTop: 24,
                  backgroundColor: statusConfig.bg,
                  border: `1px solid ${statusConfig.border}`,
                  padding: "24px",
                  borderRadius: 8,
                }}
              >
                <Flex justify="space-around" align="center">
                  <div style={{ textAlign: "center" }}>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      {renderBilingual("Data di Inizio", "生效日期", true)}
                    </Text>
                    <Text strong style={{ fontSize: 16 }}>
                      <DateField
                        value={record?.start_date}
                        format="DD/MM/YYYY"
                      />
                    </Text>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <Tag
                      color={statusConfig.color}
                      style={{
                        padding: "4px 16px",
                        borderRadius: 16,
                        fontSize: 14,
                        margin: 0,
                      }}
                    >
                      <CalendarOutlined style={{ marginRight: 6 }} />
                      {record?.duration_days} {renderBilingual("Giorni", "天")}
                    </Tag>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      {renderBilingual("Data di Scadenza", "截止日期", true)}
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: 16,
                        color: isExpired ? "#cf1322" : "inherit",
                      }}
                    >
                      <DateField value={record?.end_date} format="DD/MM/YYYY" />
                    </Text>
                  </div>
                </Flex>
              </div>

              <Divider style={{ margin: "32px 0" }} />

              {/* --- 保修条款 --- */}
              <div style={{ padding: "0 12px" }}>
                <Title level={5} style={{ marginBottom: 12 }}>
                  {renderBilingual(
                    "Termini e Condizioni di Garanzia",
                    "保修覆盖范围",
                  )}
                </Title>
                <Paragraph
                  type="secondary"
                  style={{
                    lineHeight: 1.8,
                    fontSize: 13,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {record?.coverage_details ||
                    (showChinese
                      ? "La presente garanzia copre esclusivamente i pezzi di ricambio sostituiti durante questa riparazione e la relativa manodopera. I danni accidentali (es. cadute, infiltrazioni di liquidi) e gli smontaggi non autorizzati non sono coperti.\n\n(本保修仅涵盖本次维修更换的配件及相关的人工服务。人为损坏（如跌落、进水）、私自拆解不在保修范围内。)"
                      : "La presente garanzia copre esclusivamente i pezzi di ricambio sostituiti durante questa riparazione e la relativa manodopera. I danni accidentali (es. cadute, infiltrazioni di liquidi) e gli smontaggi non autorizzati non sono coperti.")}
                </Paragraph>
              </div>

              {/* --- Footer --- */}
              <div
                style={{
                  marginTop: 64,
                  paddingTop: 24,
                  borderTop: "1px dashed #e8e8e8",
                  textAlign: "center",
                }}
              >
                <Text
                  type="secondary"
                  style={{ fontSize: 12, letterSpacing: 0.5 }}
                >
                  {import.meta.env.VITE_APP_STORE_NAME || "LUNA TECH"} •{" "}
                  {import.meta.env.VITE_APP_STORE_ADDRESS ||
                    "Indirizzo del negozio"}{" "}
                  • {import.meta.env.VITE_APP_STORE_TEL || "1234567890"}
                </Text>
              </div>
            </div>
          </Badge.Ribbon>
        </div>
      </div>
    </Show>
  );
};
