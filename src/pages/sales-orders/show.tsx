import { useState, useRef } from "react";
import { useTranslation as usei18nextTranslation } from "react-i18next";
import { useShow, useTranslation } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import {
  Typography,
  Card,
  Divider,
  Table,
  Row,
  Col,
  Tag,
  Button,
  Flex,
} from "antd";
import {
  PrinterOutlined,
  ShopOutlined,
  TranslationOutlined,
} from "@ant-design/icons";
import { useReactToPrint } from "react-to-print";
import dayjs from "dayjs";
import { formatCurrency } from "../../lib/utils";

const { Title, Text } = Typography;

export const SalesOrderShow = () => {
  const { translate } = useTranslation();
  const { i18n } = usei18nextTranslation();
  // 控制是否显示中文，默认 false (仅显示意大利语)
  const [showChinese, setShowChinese] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  const { query } = useShow({
    meta: {
      select: "*, sales_order_items(*, inventory_items(name, sku))",
    },
  });
  const { data, isLoading } = query;
  const record = data?.data;
  const currentLocale = i18n.language;

  // 辅助函数：用于渲染双语文本
  const renderBilingual = (it: string, zh: string, isBlock = false) => {
    if (!showChinese) return <>{it}</>;
    if (isBlock) {
      return (
        <>
          <div>{it}</div>
          <div
            style={{
              fontSize: "0.85em",
              color: "#8c8c8c",
              fontWeight: "normal",
            }}
          >
            {zh}
          </div>
        </>
      );
    }
    return (
      <>
        {it} <span style={{ fontSize: "0.9em", color: "#8c8c8c" }}>({zh})</span>
      </>
    );
  };

  return (
    <Show
      isLoading={isLoading}
      title={translate("sales_orders.titles.show")}
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
            onClick={reactToPrintFn}
            icon={<PrinterOutlined />}
          >
            {translate("sales_orders.show.print")}
          </Button>
          {defaultButtons}
        </>
      )}
    >
      <div
        ref={contentRef}
        style={{
          maxWidth: 800,
          margin: "0 auto",
          backgroundColor: "#fff",
          padding: "20px 0",
        }}
      >
        <Card variant="borderless" style={{ padding: "0 24px" }}>
          {/* Header：店铺信息 */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Title level={2} style={{ marginBottom: 8, letterSpacing: 1 }}>
              <ShopOutlined style={{ marginRight: 8 }} />
              {import.meta.env.VITE_APP_STORE_NAME || "NOME DEL NEGOZIO"}
            </Title>
            <Text type="secondary" style={{ display: "block", fontSize: 16 }}>
              {import.meta.env.VITE_APP_STORE_ADDRESS ||
                "Indirizzo del negozio"}
            </Text>
            <Text
              type="secondary"
              style={{ display: "block", fontSize: 14, marginTop: 4 }}
            >
              Tel: {import.meta.env.VITE_APP_STORE_TEL || "1234567890"}
            </Text>
          </div>

          {/* Order Info：订单基础信息 */}
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "16px 24px",
              borderRadius: 8,
              marginBottom: 24,
            }}
          >
            <Flex justify="space-between" align="center">
              <div>
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 4 }}
                >
                  {renderBilingual("Ordine N.", "单号")}
                </Text>
                <Text strong style={{ fontSize: 16 }}>
                  {record?.readable_id || "-"}
                </Text>
              </div>
              <div style={{ textAlign: "right" }}>
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 4 }}
                >
                  {renderBilingual("Data", "日期")}
                </Text>
                <Text strong style={{ fontSize: 16 }}>
                  {record?.created_at
                    ? dayjs(record.created_at).format("DD/MM/YYYY HH:mm")
                    : "-"}
                </Text>
              </div>
            </Flex>
          </div>

          {/* Items Table：商品列表 */}
          <Table
            dataSource={record?.sales_order_items || []}
            rowKey="id"
            pagination={false}
            size="middle"
            bordered={false}
            className="invoice-table" // 如果你有全局样式可以利用这个 class
          >
            <Table.Column
              title={renderBilingual("Prodotto", "商品", true)}
              render={(_, item: any) => (
                <div>
                  <Text strong style={{ fontSize: 14 }}>
                    {item.inventory_items?.name || "Prodotto Sconosciuto"}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    SKU: {item.inventory_items?.sku || "-"}
                  </Text>
                </div>
              )}
            />
            <Table.Column
              title={renderBilingual("Qtà", "数量", true)}
              dataIndex="quantity"
              align="center"
              render={(val) => <Text strong>x{val}</Text>}
            />
            <Table.Column
              title={renderBilingual("Prezzo", "单价", true)}
              dataIndex="unit_price"
              align="right"
              render={(val) => formatCurrency(val)}
            />
            <Table.Column
              title={renderBilingual("Subtotale", "小计", true)}
              align="right"
              render={(_, item: any) => (
                <Text strong>
                  {formatCurrency(
                    (item.quantity || 0) * (item.unit_price || 0),
                  )}
                </Text>
              )}
            />
          </Table>

          <Divider style={{ margin: "24px 0" }} />

          {/* Total Section：结算金额 */}
          <Row justify="end">
            <Col xs={24} sm={16} md={12}>
              <Flex
                justify="space-between"
                align="center"
                style={{ marginBottom: 12 }}
              >
                <Text type="secondary">
                  {renderBilingual("Metodo di Pagamento", "支付方式")}:
                </Text>
                <Tag
                  color="blue"
                  bordered={false}
                  style={{ margin: 0, fontSize: 14, padding: "2px 8px" }}
                >
                  {record?.payment_method?.toUpperCase() || "-"}
                </Tag>
              </Flex>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#f6ffed", // Ant Design 浅绿色背景
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid #b7eb8f", // Ant Design 绿色边框
                }}
              >
                <Text strong style={{ fontSize: 18 }}>
                  {renderBilingual("TOTALE", "总计")}:
                </Text>
                <Text strong style={{ color: "#3f8600", fontSize: 24 }}>
                  {formatCurrency(record?.total_amount || 0)}
                </Text>
              </div>
            </Col>
          </Row>

          {/* Footer：底部感谢语 */}
          <div
            style={{
              textAlign: "center",
              marginTop: 60,
              borderTop: "1px dashed #e8e8e8",
              paddingTop: 24,
            }}
          >
            <Title level={5} style={{ color: "#595959", marginBottom: 8 }}>
              {renderBilingual("Grazie per il vostro acquisto!", "谢谢惠顾！")}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {renderBilingual(
                "Conservare questo scontrino per la garanzia.",
                "保修期内请保留此凭证",
              )}
            </Text>
          </div>
        </Card>
      </div>
    </Show>
  );
};
