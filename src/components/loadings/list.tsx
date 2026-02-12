import { Skeleton, Card, Space } from "antd";

export const ListLoader = () => {
  return (
    <div style={{ padding: 0 }}>
      {/* 1. 模拟顶部 Header (标题 + 按钮) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16, // 与 Refine 默认间距一致
        }}
      >
        {/* 模拟标题 */}
        <Skeleton.Input
          active
          size="small"
          style={{ width: 120, height: 32 }}
        />

        {/* 模拟右上角操作按钮 */}
        <Space>
          <Skeleton.Button active shape="default" style={{ width: 90 }} />
          <Skeleton.Button active shape="default" style={{ width: 32 }} />
        </Space>
      </div>

      {/* 2. 模拟搜索/筛选区域 */}
      <Card variant="borderless" style={{ marginBottom: 16 }}>
        <Space size={16}>
          <Skeleton.Input active style={{ width: 200 }} />
          <Skeleton.Input active style={{ width: 150 }} />
          <Skeleton.Button active style={{ width: 64 }} />
        </Space>
      </Card>

      {/* 3. 模拟表格主体 */}
      <Card variant="borderless">
        {/* 模拟表头 */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            padding: "0 10px",
          }}
        >
          <Skeleton.Input active size="small" style={{ width: "10%" }} />
          <Skeleton.Input active size="small" style={{ width: "20%" }} />
          <Skeleton.Input active size="small" style={{ width: "15%" }} />
          <Skeleton.Input active size="small" style={{ width: "15%" }} />
          <Skeleton.Input active size="small" style={{ width: "10%" }} />
          <Skeleton.Input active size="small" style={{ width: "10%" }} />
        </div>

        {/* 模拟表格行内容 (10行) */}
        <Skeleton active paragraph={{ rows: 10 }} title={false} />
      </Card>
    </div>
  );
};
