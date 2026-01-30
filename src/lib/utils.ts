export const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "default"; // 草稿
    case "ordered":
      return "processing"; // 已下单
    case "received":
      return "success"; // 已入库
    case "cancelled":
      return "error"; // 已取消
    default:
      return "default";
  }
};
