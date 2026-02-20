import { Modal, Table, Tag } from "antd";
import { ITopModels } from "../../interface";
import { useTranslate } from "@refinedev/core";

interface ModelsDataModalProps {
  open: boolean;
  onCancel: () => void;
  data?: ITopModels[];
}

export const ModelsDataModal = ({
  open,
  data,
  onCancel,
}: ModelsDataModalProps) => {
  const translate = useTranslate();
  return (
    <Modal
      title={translate("modals.models.title")}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Table
        dataSource={data}
        rowKey="model_name"
        pagination={{ pageSize: 10 }}
        size="small"
        columns={[
          {
            title: translate("modals.models.columns.rank"),
            render: (_, __, index) => index + 1,
            width: 80,
          },
          {
            title: translate("modals.models.columns.name"),
            dataIndex: "model_name",
          },
          {
            title: translate("modals.models.columns.repair_count"),
            dataIndex: "repair_count",
            sorter: (a, b) => a.repair_count - b.repair_count,
            defaultSortOrder: "descend",
            render: (val) => <Tag color="blue">{val}</Tag>,
          },
        ]}
      />
    </Modal>
  );
};
