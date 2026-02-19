import { BaseRecord, useCan, useExport, useTranslate } from "@refinedev/core";
import {
  useTable,
  List,
  EditButton,
  DateField,
  DeleteButton,
  ExportButton,
} from "@refinedev/antd";
import { Table, Space } from "antd";
import { IFault } from "../../interface";
import { ListLoader } from "../../components/loadings";

export const FaultList = () => {
  const translate = useTranslate();

  const { data: canCreate } = useCan({
    resource: "device_models",
    action: "create",
  });
  const { data: canEdit } = useCan({
    resource: "device_models",
    action: "create",
  });
  const { data: canDelete } = useCan({
    resource: "device_models",
    action: "create",
  });

  const { triggerExport, isLoading: exportLoading } = useExport<IFault>();

  const {
    tableProps,
    setCurrentPage,
    pageCount,
    tableQuery: { isLoading },
  } = useTable<IFault>({
    syncWithLocation: true,
  });

  if (isLoading) {
    return <ListLoader />;
  }

  return (
    <List
      title={translate("faults.titles.list")}
      canCreate={canCreate?.can}
      headerButtons={({ defaultButtons }) => (
        <>
          {canCreate?.can && (
            <ExportButton
              onClick={triggerExport}
              loading={exportLoading}
              children="导出"
            />
          )}
          {defaultButtons}
        </>
      )}
    >
      <Table
        {...tableProps}
        pagination={{
          ...tableProps.pagination,
          position: ["bottomRight"],
          size: "small",
        }}
        rowKey="id"
      >
        <Table.Column dataIndex="id" title={translate("faults.fields.id")} />
        <Table.Column
          dataIndex="name"
          title={translate("faults.fields.name")}
        />
        <Table.Column
          dataIndex="description"
          title={translate("faults.fields.description")}
        />
        <Table.Column
          dataIndex={["created_at"]}
          title={translate("faults.fields.created_at")}
          render={(value: any) => <DateField value={value} />}
        />
        <Table.Column
          title={translate("table.actions")}
          dataIndex="actions"
          render={(_, record: BaseRecord) => (
            <Space>
              {canEdit?.can && (
                <EditButton hideText size="small" recordItemId={record.id} />
              )}
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
