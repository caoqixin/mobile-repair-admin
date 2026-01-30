import {
  Show,
  useTable,
  DeleteButton,
  EditButton as RefineEditButton, // 避免与 Antd 命名冲突
} from "@refinedev/antd";
import {
  Typography,
  Table,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Checkbox,
  InputNumber,
  Card,
} from "antd";
import { useShow, useTranslate, useParsed, HttpError } from "@refinedev/core";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useModalForm } from "@refinedev/antd";
import { IDeviceModel } from "../../interface";

const { Title, Text } = Typography;

export const DeviceModelShow = () => {
  const translate = useTranslate();
  const { id } = useParsed(); // 获取当前 URL 中的 Brand ID

  // 获取主表数据 (Brand)
  const { query: queryResult } = useShow({
    resource: "brands",
    id: id,
  });
  const { data, isLoading } = queryResult;
  const brand = data?.data;

  // 获取从表数据 (Models)
  // resource="models"
  // 过滤条件：只显示属于当前 Brand 的 models
  const { tableProps, searchFormProps, pageCount, setCurrentPage } = useTable<
    IDeviceModel,
    HttpError,
    { name: string }
  >({
    resource: "models",
    liveMode: "auto",
    filters: {
      permanent: [
        {
          field: "brand_id",
          operator: "eq",
          value: id,
        },
      ],
    },
    onSearch: (values) => {
      const { name } = values;

      return [
        {
          field: "name",
          operator: "contains", // Supabase 中对应 ilike %value%
          value: name,
        },
      ];
    },
  });

  // Create Modal Form 配置
  const {
    modalProps: createModalProps,
    formProps: createFormProps,
    show: showCreateModal,
  } = useModalForm({
    resource: "models",
    action: "create",
    defaultVisible: false,
    redirect: false,
  });

  // 4. Edit Modal Form 配置
  const {
    modalProps: editModalProps,
    formProps: editFormProps,
    show: showEditModal,
  } = useModalForm({
    resource: "models",
    action: "edit",
    redirect: false,
  });

  return (
    <Show
      isLoading={isLoading}
      title={`${brand?.name} | ${translate("brands.models.title")}`}
    >
      {/* --- A. Brand 基础信息区域 --- */}
      <Title level={5}>{translate("brands.fields.name")}</Title>
      <Text>{brand?.name}</Text>

      <Card
        variant="borderless"
        style={{
          marginBottom: "10px",
        }}
        styles={{
          body: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          },
        }}
      >
        <Form
          {...searchFormProps}
          layout="inline"
          style={{
            display: "flex",
            gap: "5px",
          }}
        >
          <Form.Item name="name" noStyle>
            <Input
              placeholder={translate("brands.models.fields.name") + " 搜索..."}
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              allowClear // 允许点击 X 清空，清空后会自动重置表格
              onClear={searchFormProps.form?.submit}
            />
          </Form.Item>
          <Form.Item noStyle>
            <Button
              icon={<SearchOutlined />}
              type="primary"
              onClick={searchFormProps.form?.submit}
            />
          </Form.Item>
        </Form>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showCreateModal()}
        >
          {translate("buttons.create")} {translate("brands.models.fields.name")}
        </Button>
      </Card>

      {/* --- B. Models 列表区域 --- */}
      <Table
        {...tableProps}
        rowKey="id"
        pagination={{
          ...tableProps.pagination,
          position: ["bottomRight"],
          size: "small",
        }}
      >
        <Table.Column
          dataIndex="name"
          title={translate("brands.models.fields.name")}
        />
        <Table.Column
          dataIndex="code"
          title={translate("brands.models.fields.code")}
        />
        <Table.Column
          dataIndex="release_year"
          title={translate("brands.models.fields.year")}
        />
        <Table.Column
          dataIndex="is_tablet"
          title={translate("brands.models.fields.isTablet")}
          render={(val) => (val ? "平板" : "手机")}
        />
        <Table.Column
          title={translate("table.actions")}
          dataIndex="actions"
          render={(_, record: any) => (
            <Space>
              {/* 点击编辑按钮，触发 Edit Modal */}
              <RefineEditButton
                hideText
                size="small"
                recordItemId={record.id}
                onClick={() => showEditModal(record.id)}
              />
              <DeleteButton
                hideText
                size="small"
                resource="models"
                recordItemId={record.id}
                onSuccess={() => {
                  if (tableProps.dataSource?.length! <= 1) {
                    setCurrentPage(pageCount - 1);
                  }
                }}
              />
            </Space>
          )}
        />
      </Table>

      {/* --- C. Create Modal --- */}
      <Modal
        {...createModalProps}
        title={translate("brands.models.form.create.title")}
      >
        <Form {...createFormProps} layout="vertical">
          <Form.Item name="brand_id" initialValue={id} hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label={translate("brands.models.form.create.fields.modelName")}
            name="name"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g. iPhone 14 Pro" />
          </Form.Item>
          <Form.Item
            label={translate("brands.models.form.create.fields.code")}
            name="code"
          >
            <Input placeholder="e.g. A2890" />
          </Form.Item>
          <Form.Item
            label={translate("brands.models.form.create.fields.year")}
            name="release_year"
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="is_tablet" valuePropName="checked">
            <Checkbox>
              {translate("brands.models.form.create.fields.isTablet")}
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* --- D. Edit Modal --- */}
      <Modal
        {...editModalProps}
        title={translate("brands.models.form.edit.title")}
      >
        <Form {...editFormProps} layout="vertical">
          <Form.Item name="brand_id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label={translate("brands.models.form.edit.fields.modelName")}
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={translate("brands.models.form.edit.fields.code")}
            name="code"
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={translate("brands.models.form.edit.fields.year")}
            name="release_year"
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="is_tablet" valuePropName="checked">
            <Checkbox>
              {translate("brands.models.form.edit.fields.isTablet")}
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </Show>
  );
};
