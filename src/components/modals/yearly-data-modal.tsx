import { Modal, Table, Typography } from "antd";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS_BASE } from "../../constants";
import { IYearlyStats } from "../../interface";
import { formatCurrency } from "../../lib/utils";

const { Text } = Typography;

interface YearlyDataModalProps {
  open: boolean;
  onCanel: () => void;
  data?: IYearlyStats[];
}
export const YearlyDataModal = ({
  open,
  data,
  onCanel,
}: YearlyDataModalProps) => {
  return (
    <Modal
      title="历年营收数据"
      open={open}
      onCancel={onCanel}
      footer={null}
      width={700}
      destroyOnHidden
    >
      <Table
        dataSource={data}
        rowKey="year"
        pagination={false}
        columns={[
          { title: "年份", dataIndex: "year", key: "year" },
          { title: "维修单量", dataIndex: "repair_count", key: "count" },
          {
            title: "总收入",
            dataIndex: "total_revenue",
            key: "revenue",
            render: (val) => (
              <Text strong style={{ color: COLORS_BASE.success }}>
                {formatCurrency(val)}
              </Text>
            ),
          },
        ]}
      />
      {open && (
        <ResponsiveContainer
          width="100%"
          height={300}
          style={{ marginTop: 24 }}
        >
          <BarChart data={data}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="total_revenue"
              name="收入"
              fill={COLORS_BASE.success}
              barSize={20}
            />
            <Bar
              dataKey="repair_count"
              name="维修"
              fill={COLORS_BASE.primary}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Modal>
  );
};
