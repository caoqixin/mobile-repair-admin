import { Button, Popconfirm } from "antd";
import { RedoOutlined } from "@ant-design/icons";
import {
  useCreate,
  useGetIdentity,
  useNavigation,
  useNotification,
  useTranslate,
} from "@refinedev/core";

type Props = {
  record: any; // 传入当前的保修单记录
};

export const CreateReturnButton = ({ record }: Props) => {
  const translate = useTranslate();
  const { open } = useNotification();
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
      open?.({
        type: "error",
        message: translate("warranty.message.warning"),
      });
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
          problem_description: translate("warranty.text.description", {
            count: record.claim_count + 1,
            id: record.repair_orders?.readable_id,
          }),
          total_price: 0,
          warranty_id: record.id,
        },
      },
      {
        onSuccess: (data) => {
          open?.({
            type: "success",
            message: translate("warranty.message.success"),
          });

          // 3. 创建成功后，跳转到新单的编辑页
          show("repair_orders", data.data.id as number);
        },
        onError: (error) => {
          open?.({
            type: "error",
            message: translate("warranty.message.error", {
              message: error.message,
            }),
          });
        },
      },
    );
  };

  return (
    <Popconfirm
      title={translate("warranty.confirm.title")}
      description={translate("warranty.confirm.description", {
        count: record.claimed_count || 0,
      })}
      onConfirm={handleCreateReturn}
      okText={translate("warranty.confirm.okText")}
      cancelText={translate("warranty.confirm.cancelText")}
    >
      <Button
        icon={<RedoOutlined />}
        size="small"
        loading={isPending}
        // 如果状态已经是 claimed，禁用按钮
        disabled={record.status === "claimed"}
      >
        {translate("warranty.confirm.confirmText")}
      </Button>
    </Popconfirm>
  );
};
