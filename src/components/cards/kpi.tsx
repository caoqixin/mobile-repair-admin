import { Avatar, Card, Flex, Skeleton, Statistic, Typography } from "antd";

const { Text } = Typography;

interface KpiCardProps {
  loading: boolean;
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  color: string;
  icon: React.ReactNode;
  footer: React.ReactNode;
  onClick?: () => void;
}

export const KpiCard = ({
  title,
  value,
  prefix,
  suffix,
  color,
  icon,
  footer,
  onClick,
  loading,
}: KpiCardProps) => (
  <Card
    variant="borderless"
    styles={{ body: { padding: 20, height: "100%" } }}
    hoverable={!!onClick}
    onClick={loading ? undefined : onClick}
    style={{ cursor: onClick && !loading ? "pointer" : "default" }}
  >
    {/* 如果 loading 为 true，显示骨架屏 */}
    <Skeleton loading={loading} active avatar paragraph={{ rows: 1 }}>
      <Flex justify="space-between" align="start">
        <div>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {title}
          </Text>
          <div style={{ marginTop: 8 }}>
            <Statistic
              value={value}
              prefix={prefix}
              suffix={suffix}
              valueStyle={{ fontWeight: 600, fontSize: 24 }}
            />
          </div>
          {footer && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#8c8c8c" }}>
              {footer}
            </div>
          )}
        </div>
        <Avatar
          shape="square"
          size={48}
          icon={icon}
          style={{
            backgroundColor: `${color}15`,
            color: color,
            borderRadius: 12,
          }}
        />
      </Flex>
    </Skeleton>
  </Card>
);
