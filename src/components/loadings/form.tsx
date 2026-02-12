import { Skeleton, Card, Space, Row, Col } from "antd";

export const FormLoader = () => {
  return (
    <div style={{ padding: 0 }}>
      {/* 1. 顶部 Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Space align="center">
          {/* 返回按钮 */}
          <Skeleton.Button
            active
            shape="circle"
            size="small"
            style={{ width: 32, height: 32 }}
          />
          {/* 标题 */}
          <Skeleton.Input
            active
            size="small"
            style={{ width: 120, height: 28 }}
          />
        </Space>

        {/* 右上角列表按钮 */}
        <Skeleton.Button active style={{ width: 80 }} />
      </div>

      {/* 2. 表单主体 */}
      <Card variant="borderless">
        <Row gutter={[32, 24]}>
          {/* 模拟双列布局表单 */}
          {[1, 2, 3, 4].map((i) => (
            <Col span={24} md={12} key={i}>
              {/* Label */}
              <div style={{ marginBottom: 8 }}>
                <Skeleton.Input
                  active
                  size="small"
                  style={{ width: 80, height: 16 }}
                />
              </div>
              {/* Input */}
              <Skeleton.Input
                active
                size="large"
                style={{ width: "100%", height: 40, borderRadius: 6 }}
              />
            </Col>
          ))}

          {/* 模拟单列宽文本域 (Textarea) */}
          <Col span={24}>
            <div style={{ marginBottom: 8 }}>
              <Skeleton.Input
                active
                size="small"
                style={{ width: 100, height: 16 }}
              />
            </div>
            <Skeleton.Input
              active
              size="large"
              style={{ width: "100%", height: 100, borderRadius: 6 }}
            />
          </Col>
        </Row>

        {/* 底部保存按钮 */}
        <div style={{ marginTop: 24 }}>
          <Skeleton.Button active size="large" style={{ width: 100 }} />
        </div>
      </Card>
    </div>
  );
};
