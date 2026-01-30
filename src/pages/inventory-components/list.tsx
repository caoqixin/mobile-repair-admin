import {
  List,
  useTable,
  useSelect,
  EditButton,
  ShowButton,
  DeleteButton,
  NumberField,
} from "@refinedev/antd";
import {
  Table,
  Form,
  Input,
  Select,
  Card,
  Space,
  Tag,
  Row,
  Col,
  Button,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useTranslate, CrudFilters, HttpError } from "@refinedev/core";
import { useState } from "react";
import { IInventoryComponent } from "../../interface";

export const InventoryComponentsList = () => {
  const translate = useTranslate();

  // 用于联动：选了品牌后，机型下拉框只显示该品牌的机型
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);

  const { tableProps, searchFormProps } = useTable<
    IInventoryComponent,
    HttpError,
    { q: string; category_id: number; brand_id: number; model_id: number }
  >({
    syncWithLocation: true,
    resource: "inventory_components",
    meta: {
      // 联表查询：分类、供应商
      select:
        "*, categories(id, name), suppliers(id, name), component_compatibility!inner(model_id,models!inner(brand_id))",
    },
    onSearch: (params) => {
      const filters: CrudFilters = [];
      const { q, category_id, model_id, brand_id } = params;

      // 1. 关键词搜索 (同时搜名称和SKU)

      filters.push({
        operator: "or",
        value: [
          { field: "name", operator: "contains", value: q },
          { field: "sku", operator: "contains", value: q },
        ],
      });

      // 2. 分类筛选
      filters.push({
        field: "category_id",
        operator: "eq",
        value: category_id,
      });

      // 3. 机型筛选 (核心逻辑)
      // 通过 component_compatibility 表中的 model_id 进行筛选
      // Supabase Data Provider 支持这种嵌套过滤语法
      filters.push({
        field: "component_compatibility.models.brand_id",
        operator: "eq",
        value: brand_id,
      });

      filters.push({
        field: "component_compatibility.model_id",
        operator: "eq",
        value: model_id,
      });

      return filters;
    },
  });

  // 获取分类下拉数据 (仅限 component 类型)
  const { selectProps: categorySelectProps } = useSelect({
    resource: "categories",
    filters: [{ field: "type", operator: "eq", value: "component" }],
    optionLabel: "name",
    optionValue: "id",
  });

  // 获取品牌下拉数据
  const { selectProps: brandSelectProps } = useSelect({
    resource: "brands",
    optionLabel: "name",
    optionValue: "id",
  });

  // 获取机型下拉数据 (依赖选中的品牌)
  const { selectProps: modelSelectProps } = useSelect({
    resource: "models",

    optionLabel: "name",
    optionValue: "id",
    filters: selectedBrand
      ? [{ field: "brand_id", operator: "eq", value: selectedBrand }]
      : [],
    queryOptions: {
      enabled: !!selectedBrand, // 只有选了品牌才加载机型
    },
  });

  return (
    <List>
      {/* --- 顶部搜索筛选栏 --- */}
      <Card variant="borderless" styles={{ body: { padding: "24px" } }}>
        <Form
          {...searchFormProps}
          layout="vertical"
          initialValues={{
            q: "",
            category_id: null,
            brand_id: null,
            model_id: null,
          }}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="搜索" name="q">
                <Input
                  placeholder="搜索名称或SKU..."
                  prefix={<SearchOutlined />}
                  allowClear
                  onClear={searchFormProps.form?.submit}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label={translate("resources.categories")}
                name="category_id"
              >
                <Select
                  {...categorySelectProps}
                  allowClear
                  placeholder="全部分类"
                  onClear={searchFormProps.form?.submit}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="品牌筛选" name="brand_id">
                <Select
                  {...brandSelectProps}
                  allowClear
                  onClear={searchFormProps.form?.submit}
                  placeholder="先选品牌"
                  onChange={(val) => {
                    setSelectedBrand(val as unknown as number);
                    searchFormProps.form?.setFieldValue("model_id", null);
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="适用机型" name="model_id">
                <Select
                  {...modelSelectProps}
                  allowClear
                  placeholder={selectedBrand ? "选择机型" : "请先选择品牌"}
                  disabled={!selectedBrand}
                />
              </Form.Item>
            </Col>
            <Col span={4} style={{ display: "flex", alignItems: "flex-end" }}>
              <Form.Item>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={searchFormProps.form?.submit}
                >
                  查询
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* --- 表格区域 --- */}
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="sku"
          title={translate("inventory_components.fields.sku")}
          width={120}
        />
        <Table.Column
          dataIndex="name"
          title={translate("inventory_components.fields.name")}
          width={250}
        />
        <Table.Column
          dataIndex={["categories", "name"]}
          title={translate("inventory_components.fields.category")}
          render={(val) => (val ? <Tag>{val}</Tag> : "-")}
        />
        <Table.Column
          dataIndex="quality"
          title={translate("inventory_components.fields.quality")}
          render={(val) => {
            const colors: any = { original: "gold", compatible: "blue" };
            return <Tag color={colors[val] || "default"}>{val}</Tag>;
          }}
        />
        <Table.Column
          dataIndex="stock_quantity"
          title={translate("inventory_components.fields.stock")}
          render={(val) => (
            <Tag color={val > 0 ? "green" : "red"}>
              {val > 0 ? `${val} 在库` : "缺货"}
            </Tag>
          )}
          sorter
        />
        <Table.Column
          dataIndex="cost_price"
          title={translate("inventory_components.fields.cost")}
          align="right"
          render={(val) => (
            <NumberField
              value={val}
              options={{ style: "currency", currency: "EUR" }}
            />
          )}
        />
        <Table.Column
          dataIndex="suggested_repair_price"
          title={translate("inventory_components.fields.repair_price")}
          align="right"
          render={(val) => (
            <NumberField
              value={val}
              options={{ style: "currency", currency: "EUR" }}
            />
          )}
        />
        <Table.Column
          dataIndex="partner_repair_price"
          title={translate("inventory_components.fields.partner_price")}
          align="right"
          render={(val) => (
            <NumberField
              value={val}
              options={{ style: "currency", currency: "EUR" }}
            />
          )}
        />
        <Table.Column
          title={translate("table.actions")}
          dataIndex="actions"
          render={(_, record: any) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
