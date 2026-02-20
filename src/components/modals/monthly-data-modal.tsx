import { Modal, Table } from "antd";
import dayjs from "dayjs";
import { IMonthlyStats } from "../../interface";
import { formatCurrency } from "../../lib/utils";
import { useTranslate } from "@refinedev/core";

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
  const translate = useTranslate();
  return (
    <Modal
      title={translate("modals.monthly.title", { year: dayjs().year() })}
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
          {
            title: translate("modals.monthly.columns.month"),
            dataIndex: "month_str",
          },
          {
            title: translate("modals.monthly.columns.repair_count"),
            dataIndex: "repair_count",
          },
          {
            title: translate("modals.monthly.columns.total_revenue"),
            dataIndex: "total_revenue",
            render: (val) => formatCurrency(val),
          },
        ]}
      />
    </Modal>
  );
};
