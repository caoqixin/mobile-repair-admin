import React from "react";
import { Button, Popconfirm, message } from "antd";
import { RedoOutlined } from "@ant-design/icons";
import {
  useCreate,
  useGetIdentity,
  useNavigation,
  useTranslate,
} from "@refinedev/core";

type Props = {
  record: any; // 传入当前的保修单记录
};

export const CreateReturnButton = ({ record }: Props) => {
  const {
    mutate,
    mutation: { isPending },
  } = useCreate();
  const { show } = useNavigation();

  const { data: userData } = useGetIdentity();

  // 处理返修逻辑
  const handleCreateReturn = () => {
    // 检查是否已经是 'claimed' 状态，防止重复点击
    if (record.status === "claimed") {
      message.warning("该保修单正在返修处理中，请勿重复创建。");
      return;
    }

    // 2. 构造新维修单的数据
    mutate(
      {
        resource: "repair_orders",
        values: {
          customer_id: record.customer_id, // 关联同一个客户
          technician_id: userData.id,

          // 复用设备信息
          model_id: record.repair_orders?.model_id,
          imei_sn: record.repair_orders?.imei_sn,

          // 初始状态
          status: "approved",

          // 自动备注
          problem_description: `[保修返修] 第 ${
            record.claim_count + 1
          } 次报修。关联原单号: ${record.repair_orders?.readable_id}`,
          total_price: 0,
          warranty_id: record.id,
        },
      },
      {
        onSuccess: (data) => {
          message.success("返修单创建成功");
          // 3. 创建成功后，跳转到新单的编辑页
          show("repair_orders", data.data.id as number);
        },
        onError: (error) => {
          message.error(`创建失败: ${error.message}`);
        },
      },
    );
  };

  return (
    <Popconfirm
      title="确认返修?"
      description={`当前已理赔次数: ${
        record.claimed_count || 0
      }。确认创建返修单？`}
      onConfirm={handleCreateReturn}
      okText="创建"
      cancelText="取消"
    >
      <Button
        icon={<RedoOutlined />}
        size="small"
        loading={isPending}
        // 如果状态已经是 claimed，禁用按钮
        disabled={record.status === "claimed"}
      >
        返修
      </Button>
    </Popconfirm>
  );
};
