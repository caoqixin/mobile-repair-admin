import { Modal, Table, Tag } from "antd";
import { ITopModels } from "../../interface";

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
  return (
    <Modal
      title="所有维修机型统计"
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
            title: "排名",
            render: (_, __, index) => index + 1,
            width: 80,
          },
          { title: "机型名称", dataIndex: "model_name" },
          {
            title: "维修次数",
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
