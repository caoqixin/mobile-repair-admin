import { useState } from "react";
import { useSelect } from "@refinedev/antd";
import { CategoryType } from "../interface";

type UseInventoryOptionsProps = {
  // 可选：分类的类型过滤，默认为 'component'
  categoryType?: CategoryType;
  // 可选：编辑模式下的初始品牌ID (用于回显机型列表)
  initialBrandId?: number | string;
};

export const useInventoryOptions = ({
  categoryType = "component",
  initialBrandId,
}: UseInventoryOptionsProps = {}) => {
  // 内部状态：用于控制机型数据的加载
  const [selectedBrand, setSelectedBrand] = useState<
    string | number | undefined
  >(initialBrandId);

  // 1. 获取分类 (Categories)
  const { selectProps: categorySelectProps } = useSelect({
    resource: "categories",
    filters: [
      {
        field: "type",
        operator: "eq",
        value: categoryType,
      },
    ],
    optionLabel: "name",
    optionValue: "id",
    pagination: { mode: "off" },
  });

  // 2. 获取品牌 (Brands)
  const { selectProps: brandSelectProps } = useSelect({
    resource: "brands",
    optionLabel: "name",
    optionValue: "id",
    defaultValue: initialBrandId, // 确保编辑时回显正确
    pagination: { mode: "off" },
  });

  // 3. 获取机型 (Models) - 依赖品牌
  const { selectProps: modelSelectProps, query: modelQuery } = useSelect({
    resource: "models",
    optionLabel: "name",
    optionValue: "id",
    // 级联核心逻辑
    filters: selectedBrand
      ? [
          {
            field: "brand_id",
            operator: "eq",
            value: selectedBrand,
          },
        ]
      : [],
    pagination: { mode: "off" },
    // 只有选中品牌后才发起请求
    queryOptions: {
      enabled: !!selectedBrand,
    },
  });

  // 4. 封装一个处理函数：当品牌改变时，更新内部状态
  // 注意：在 UI 组件中，你需要手动调用这个 onChange 或者结合 Form 的联动
  const handleBrandChange = (value: string | number) => {
    setSelectedBrand(value);
  };

  return {
    categorySelectProps,
    brandSelectProps,
    modelSelectProps,
    // 暴露状态和setter，以便外部处理清空机型等逻辑
    selectedBrand,
    setSelectedBrand,
    handleBrandChange,
    isModelLoading: modelQuery.isLoading,
  };
};
