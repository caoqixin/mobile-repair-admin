import {
  List,
  useTable,
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
import { useTranslate, HttpError, useCan } from "@refinedev/core";
import { IInventoryComponent } from "../../interface";
import { ListLoader } from "../../components/loadings";
import { useInventoryOptions } from "../../hooks/useInventoryOptions";

export const InventoryComponentsList = () => {
  const translate = useTranslate();
  const { data: canDelete } = useCan({
    resource: "inventory_components",
    action: "delete",
  });
  const {
    tableProps,
    searchFormProps,
    tableQuery: { isLoading },
    setCurrentPage,
    pageCount,
  } = useTable<
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
      const { q, category_id, model_id, brand_id } = params;

      return [
        {
          operator: "or",
          value: [
            { field: "name", operator: "contains", value: q },
            { field: "sku", operator: "contains", value: q },
          ],
        },
        {
          field: "category_id",
          operator: "eq",
          value: category_id,
        },
        {
          field: "component_compatibility.models.brand_id",
          operator: "eq",
          value: brand_id,
        },
        {
          field: "component_compatibility.model_id",
          operator: "eq",
          value: model_id,
        },
      ];
    },
  });

  const {
    categorySelectProps,
    brandSelectProps,
    modelSelectProps,
    handleBrandChange,
    selectedBrand,
  } = useInventoryOptions();

  if (isLoading) {
    return <ListLoader />;
  }

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
              <Form.Item
                label={translate("inventory_components.search.label.query")}
                name="q"
              >
                <Input
                  placeholder={translate(
                    "inventory_components.search.placeholder.query",
                  )}
                  prefix={<SearchOutlined />}
                  allowClear
                  onClear={searchFormProps.form?.submit}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label={translate("inventory_components.search.label.category")}
                name="category_id"
              >
                <Select
                  {...categorySelectProps}
                  allowClear
                  placeholder={translate(
                    "inventory_components.search.placeholder.category",
                  )}
                  onSearch={undefined}
                  filterOption={true}
                  optionFilterProp="label"
                  onClear={searchFormProps.form?.submit}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label={translate("inventory_components.search.label.brand")}
                name="brand_id"
              >
                <Select
                  {...brandSelectProps}
                  allowClear
                  onClear={searchFormProps.form?.submit}
                  placeholder={translate(
                    "inventory_components.search.placeholder.brand",
                  )}
                  onSearch={undefined}
                  filterOption={true}
                  optionFilterProp="label"
                  onChange={(val) => {
                    handleBrandChange(val as unknown as number);
                    searchFormProps.form?.setFieldValue("model_id", null);
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={translate("inventory_components.search.label.model")}
                name="model_id"
              >
                <Select
                  {...modelSelectProps}
                  allowClear
                  onSearch={undefined}
                  filterOption={true}
                  optionFilterProp="label"
                  placeholder={
                    selectedBrand
                      ? translate(
                          "inventory_components.search.placeholder.model",
                        )
                      : translate(
                          "inventory_components.search.placeholder.noModel",
                        )
                  }
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
                  {translate("inventory_components.search.label.button")}
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
              {val > 0
                ? `${val} ${translate("inventory_components.fields.inStock")}`
                : translate("inventory_components.fields.outStock")}
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
              {canDelete?.can && (
                <DeleteButton
                  hideText
                  size="small"
                  recordItemId={record.id}
                  onSuccess={() => {
                    if (tableProps.dataSource?.length! <= 1) {
                      setCurrentPage(pageCount - 1);
                    }
                  }}
                />
              )}
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
