import React, { useRef } from "react";
import { useShow } from "@refinedev/core";
import { Show, DateField } from "@refinedev/antd";
import {
  Typography,
  Card,
  Descriptions,
  Divider,
  Button,
  Row,
  Col,
  Tag,
  Alert,
} from "antd";
import {
  PrinterOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

export const WarrantyShow = () => {
  const { query } = useShow({
    meta: {
      select:
        "*, repair_orders!warranties_repair_order_id_fkey(readable_id, problem_description, models(name)),  customers(full_name, phone, email)",
    },
  });
  const { data, isLoading } = query;
  const record = data?.data;

  const handlePrint = () => {
    window.print();
  };

  // 判断是否在保
  const isExpired = record ? dayjs().isAfter(dayjs(record.end_date)) : false;

  return (
    <Show
      isLoading={isLoading}
      title="保修详情"
      headerButtons={({ defaultButtons }) => (
        <>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            打印证书 (Stampa)
          </Button>
          {defaultButtons}
        </>
      )}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }} className="print-area">
        {/* 状态横幅 */}
        {record?.status === "void" ? (
          <Alert
            message="此保修单已作废 (VOID)"
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        ) : isExpired ? (
          <Alert
            message="保修已过期 (EXPIRED)"
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        ) : (
          <Alert
            message="保修生效中 (ACTIVE)"
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Card
          variant="borderless"
          className="certificate-box"
          style={{ border: "2px solid #d9d9d9", borderRadius: 8 }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <SafetyCertificateOutlined
              style={{ fontSize: 48, color: "#3f8600" }}
            />
            <Title level={2} style={{ marginTop: 16 }}>
              Luna Tech 保修证书
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Certificato di Garanzia
            </Text>
          </div>

          {/* 核心信息 */}
          <Descriptions
            bordered
            column={1}
            labelStyle={{ width: 150, fontWeight: "bold" }}
          >
            <Descriptions.Item label="保修单号 (ID)">
              <Text copyable strong>
                {record?.readable_id}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="客户 (Cliente)">
              {record?.customers?.full_name} ({record?.customers?.phone})
            </Descriptions.Item>
            <Descriptions.Item label="关联维修 (Riparazione)">
              <Text strong>{record?.repair_orders?.models.name}</Text>
              <br />
              <Text type="secondary">
                单号: {record?.repair_orders?.readable_id}
              </Text>
              <br />
              <Text type="secondary">
                故障: {record?.repair_orders?.problem_description}
              </Text>
            </Descriptions.Item>
          </Descriptions>

          <Divider dashed />

          {/* 期限信息 */}
          <Row gutter={24} style={{ textAlign: "center" }}>
            <Col span={8}>
              <Title level={5}>生效日期</Title>
              <Text>
                <DateField value={record?.start_date} format="YYYY-MM-DD" />
              </Text>
            </Col>
            <Col span={8}>
              <Title level={5}>保修时长</Title>
              <Tag color="blue" style={{ fontSize: 16, padding: "4px 12px" }}>
                {record?.duration_days} 天
              </Tag>
            </Col>
            <Col span={8}>
              <Title level={5}>截止日期</Title>
              <Text strong style={{ color: isExpired ? "red" : "green" }}>
                <DateField value={record?.end_date} format="YYYY-MM-DD" />
              </Text>
            </Col>
          </Row>

          <Divider dashed />

          {/* 保修条款 */}
          <div>
            <Title level={5}>保修覆盖范围 (Copertura):</Title>
            <Paragraph>
              {record?.coverage_details ||
                "本保修仅涵盖本次维修更换的配件及相关的人工服务。人为损坏（如跌落、进水）、私自拆解不在保修范围内。"}
            </Paragraph>
          </div>

          <div
            style={{
              marginTop: 24,
              fontSize: 12,
              color: "#999",
              textAlign: "center",
            }}
          >
            <Text type="secondary">
              {import.meta.env.VITE_APP_STORE_NAME} ·{" "}
              {import.meta.env.VITE_APP_STORE_ADDRESS} ·{" "}
              {import.meta.env.VITE_APP_STORE_TEL}
            </Text>
          </div>
        </Card>
      </div>
    </Show>
  );
};
