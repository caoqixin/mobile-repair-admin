import { Modal, Table } from "antd";
import dayjs from "dayjs";
import { IMonthlyStats } from "../../interface";

interface MonthlyDataModalProps {
  open: boolean;
  onCancel: () => void;
  data?: IMonthlyStats[];
}

export const MonthlyDataModal = ({
  open,
  data,
  onCancel,
}: MonthlyDataModalProps) => {
  return (
    <Modal
      title={`${dayjs().year()}年 月度详情`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Table
        dataSource={data}
        rowKey="month_str"
        pagination={false}
        size="small"
        columns={[
          { title: "月份", dataIndex: "month_str" },
          { title: "单量", dataIndex: "repair_count" },
          {
            title: "收入",
            dataIndex: "total_revenue",
            render: (val) => `€ ${Number(val).toFixed(2)}`,
          },
        ]}
      />
    </Modal>
  );
};
