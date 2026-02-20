import React, { useEffect } from "react";
import { ThemedLayoutContextProvider } from "@refinedev/antd";
import { ThemedHeader as DefaultHeader } from "./header";
import { ThemedSider as DefaultSider } from "./sider";
import { Grid, Layout as AntdLayout } from "antd";
import type { RefineThemedLayoutProps } from "@refinedev/antd";
import { useTranslation } from "react-i18next";
import { useParsed, useResourceParams } from "@refinedev/core";
import { customTitleHandler } from "../../lib/customTitleHandler";

export const ThemedLayout: React.FC<RefineThemedLayoutProps> = ({
  children,
  Header,
  Sider,
  Title,
  Footer,
  OffLayoutArea,
  initialSiderCollapsed,
  onSiderCollapsed,
}) => {
  const breakpoint = Grid.useBreakpoint();
  const SiderToRender = Sider ?? DefaultSider;
  const HeaderToRender = Header ?? DefaultHeader;
  const isSmall = typeof breakpoint.sm === "undefined" ? true : breakpoint.sm;
  const hasSider = !!SiderToRender({ Title });
  const { i18n } = useTranslation();
  const { resource, action, id } = useResourceParams(); // 获取当前资源和动作
  const { params } = useParsed();

  useEffect(() => {
    // 当语言切换时，手动重新计算并设置标题
    const newTitle = customTitleHandler({
      resource,
      action: action as any,
      params: { id: id as string },
    });

    document.title = newTitle;
  }, [i18n.language, resource, action, id]); // 监听语言和路由状态

  return (
    <ThemedLayoutContextProvider
      initialSiderCollapsed={initialSiderCollapsed}
      onSiderCollapsed={onSiderCollapsed}
    >
      <AntdLayout style={{ minHeight: "100vh" }} hasSider={hasSider}>
        <SiderToRender Title={Title} />
        <AntdLayout>
          <HeaderToRender />
          <AntdLayout.Content>
            <div
              style={{
                minHeight: 360,
                padding: isSmall ? 24 : 12,
              }}
            >
              {children}
            </div>
            {OffLayoutArea && <OffLayoutArea />}
          </AntdLayout.Content>
          {Footer && <Footer />}
        </AntdLayout>
      </AntdLayout>
    </ThemedLayoutContextProvider>
  );
};
