import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import { useGetIdentity, useLogout, useTranslation } from "@refinedev/core";
import {
  Layout as AntdLayout,
  Avatar,
  Button,
  Dropdown,
  MenuProps,
  Space,
  Switch,
  theme,
  Typography,
} from "antd";
import { DownOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import React, { useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useTranslation as usei18nextTranslation } from "react-i18next";
import { IProfile } from "../../interface";
import { Link } from "react-router";

const { Text } = Typography;
const { useToken } = theme;

export const Header: React.FC<RefineThemedLayoutHeaderProps> = ({
  sticky = true,
}) => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<IProfile>();
  const { mode, setMode } = useContext(ColorModeContext);
  const { i18n } = usei18nextTranslation();
  const { changeLocale, translate } = useTranslation();
  const currentLocale = i18n.language;
  const { mutate: logout } = useLogout();

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1;
  }

  const menuItems: MenuProps["items"] = [...(i18n.languages || [])]
    .sort()
    .map((lang: string) => ({
      key: lang,
      onClick: () => changeLocale(lang),
      icon: (
        <span style={{ marginRight: 8 }}>
          <Avatar size={16} src={`/images/flags/${lang}.svg`} />
        </span>
      ),
      label: lang === "it" ? "Italiano" : "简体中文",
    }));

  // 用户下拉菜单
  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: <Link to="/my">{translate("pages.myProfile.menu.my")}</Link>,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: translate("pages.myProfile.menu.logout"),
      onClick: () => logout(), // 触发退出
    },
  ];

  return (
    <AntdLayout.Header style={headerStyles}>
      <Space>
        <Switch
          checkedChildren="🌛"
          unCheckedChildren="🔆"
          onChange={() => setMode(mode === "light" ? "dark" : "light")}
          defaultChecked={mode === "dark"}
        />
        <Dropdown
          menu={{
            items: menuItems,
            selectedKeys: currentLocale ? [currentLocale] : [],
          }}
        >
          <Button type="text">
            <Space>
              <Avatar size={16} src={`/images/flags/${currentLocale}.svg`} />
              {currentLocale === "it" ? "Italiano" : "简体中文"}
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>

        <Space style={{ marginLeft: "8px" }} size="middle">
          {user && (
            <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
              <Button type="text" style={{ padding: "0 8px" }}>
                <Space size="small">
                  <Text strong>{user.full_name || user.email}</Text>
                  <DownOutlined style={{ fontSize: "12px" }} />
                </Space>
              </Button>
            </Dropdown>
          )}
        </Space>
      </Space>
    </AntdLayout.Header>
  );
};
