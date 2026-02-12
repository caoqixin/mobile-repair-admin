import { Skeleton, Card, Space, Row, Col, Divider } from "antd";

export const ShowLoader = () => {
  return (
    <div style={{ padding: 0 }}>
      {/* 1. 顶部 Header (标题 + 操作按钮) */}
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
            style={{ width: 150, height: 28 }}
          />
        </Space>

        <Space>
          {/* 编辑、删除、刷新等按钮 */}
          <Skeleton.Button active style={{ width: 80 }} />
          <Skeleton.Button active style={{ width: 80 }} />
        </Space>
      </div>

      {/* 2. 详情内容卡片 */}
      <Card variant="borderless" style={{ marginBottom: 24 }}>
        {/* 模拟 Description 列表 (多行多列) */}
        <Row gutter={[24, 24]}>
          {/* 生成 6 个模拟字段 */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Col span={12} md={8} key={i}>
              <div style={{ marginBottom: 6 }}>
                <Skeleton.Input
                  active
                  size="small"
                  style={{ width: "40%", height: 16, marginBottom: 8 }}
                />
              </div>
              <div>
                <Skeleton.Input
                  active
                  size="default"
                  style={{ width: "80%", height: 24 }}
                />
              </div>
            </Col>
          ))}
        </Row>

        <Divider />

        {/* 模拟大段文本 (如备注) */}
        <div style={{ marginTop: 16 }}>
          <Skeleton.Input
            active
            size="small"
            style={{ width: "10%", marginBottom: 12 }}
          />
          <Skeleton active paragraph={{ rows: 3 }} title={false} />
        </div>
      </Card>

      {/* 3. 模拟底部关联数据 (可选，模拟详情页下方的 Tab 或 Table) */}
      <Card
        variant="borderless"
        title={<Skeleton.Input active style={{ width: 100 }} size="small" />}
      >
        <Skeleton active paragraph={{ rows: 4 }} title={false} />
      </Card>
    </div>
  );
};
