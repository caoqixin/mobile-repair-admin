import { BaseRecord, usePermissions, useTranslate } from "@refinedev/core";
import {
  useTable,
  List,
  EditButton,
  EmailField,
  DateField,
  TextField,
} from "@refinedev/antd";
import { Table, Space } from "antd";
import { IProfile, UserRole } from "../../interface";
import { USER_ROLE_MAP } from "../../constants";

export const ProfileList = () => {
  const translate = useTranslate();
  const { tableProps } = useTable<IProfile>({
    syncWithLocation: true,
  });
  const { data: role } = usePermissions({});

  return (
    <List canCreate={role[0].role === "admin"}>
      <Table
        {...tableProps}
        pagination={{
          ...tableProps.pagination,
          position: ["bottomRight"],
          size: "small",
        }}
        rowKey="id"
      >
        <Table.Column
          dataIndex={["email"]}
          title={translate("profiles.fields.email")}
          render={(value: any) => <EmailField value={value} />}
        />
        <Table.Column
          dataIndex="full_name"
          title={translate("profiles.fields.full_name")}
        />
        <Table.Column
          dataIndex="role"
          title={translate("profiles.fields.role")}
          render={(value: UserRole) => (
            <TextField value={USER_ROLE_MAP[value]} />
          )}
        />
        <Table.Column
          dataIndex={["created_at"]}
          title={translate("profiles.fields.created_at")}
          render={(value: any) => <DateField value={value} />}
        />
        {role[0].role === "admin" && (
          <Table.Column
            title={translate("table.actions")}
            dataIndex="actions"
            render={(_, record: BaseRecord) => (
              <Space>
                <EditButton hideText size="small" recordItemId={record.id} />
              </Space>
            )}
          />
        )}
      </Table>
    </List>
  );
};
