import { Authenticated, I18nProvider, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  AuthPage,
  ErrorComponent,
  useNotificationProvider,
} from "@refinedev/antd";
import "@ant-design/v5-patch-for-react-19";
import "@refinedev/antd/dist/reset.css";

import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { liveProvider } from "@refinedev/supabase";
import { App as AntdApp } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { Header } from "./components/header";
import { ColorModeContextProvider } from "./contexts/color-mode";
import {
  CategoryCreate,
  CategoryEdit,
  CategoryList,
  CategoryShow,
} from "./pages/categories";
import authProvider from "./providers/auth";
import { dataProvider } from "./providers/data";
import { supabaseClient } from "./providers/supabase-client";
import { useTranslation } from "react-i18next";
import { ThemedLayout } from "./components/layout";
import { ThemedSider } from "./components/layout/sider";
import { ThemedTitle } from "./components/layout/title";
import { resources } from "./resources";
import { Dashboard } from "./pages/dashboard";
import { Quote } from "./pages/quote/list";
import {
  RepairOrderCreate,
  RepairOrderEdit,
  RepairOrderList,
  RepairOrderShow,
} from "./pages/repair-orders";
import {
  SalesOrderCreate,
  SalesOrderList,
  SalesOrderShow,
} from "./pages/sales-orders";
import {
  CustomerCreate,
  CustomerEdit,
  CustomerList,
  CustomerShow,
} from "./pages/customers";
import {
  InventoryComponentsCreate,
  InventoryComponentsEdit,
  InventoryComponentsList,
  InventoryComponentsShow,
} from "./pages/inventory-components";
import {
  InventoryItemsCreate,
  InventoryItemsEdit,
  InventoryItemsList,
  InventoryItemsShow,
} from "./pages/inventory-items";
import {
  PurchaseOrderCreate,
  PurchaseOrderEdit,
  PurchaseOrderList,
  PurchaseOrderShow,
} from "./pages/purchase-orders";
import {
  StockEntriesCreate,
  StockEntriesList,
  StockEntriesShow,
} from "./pages/stock-entries";
import {
  SupplierCreate,
  SupplierEdit,
  SupplierList,
  SupplierShow,
} from "./pages/suppliers";
import { TransactionsCreate, TransactionsList } from "./pages/transactions";
import {
  DeviceModelCreate,
  DeviceModelEdit,
  DeviceModelList,
  DeviceModelShow,
} from "./pages/device-models";
import { FaultCreate, FaultEdit, FaultList, FaultShow } from "./pages/faults";
import { ProfileCreate, ProfileEdit, ProfileList } from "./pages/profiles";
import { WarrantyList, WarrantyShow } from "./pages/warranties";

function App() {
  const { t, i18n } = useTranslation();

  const i18nProvider: I18nProvider = {
    translate: (key: string, options?: any) => t(key, options) as string,
    changeLocale: (lang: string) => i18n.changeLanguage(lang),
    getLocale: () => i18n.language,
  };

  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <DevtoolsProvider>
              <Refine
                dataProvider={dataProvider}
                liveProvider={liveProvider(supabaseClient)}
                authProvider={authProvider}
                routerProvider={routerProvider}
                notificationProvider={useNotificationProvider}
                i18nProvider={i18nProvider}
                resources={resources()}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "JXabbB-6wc3D6-tgE9yj",
                }}
              >
                <Routes>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <ThemedLayout
                          Header={Header}
                          Sider={(props) => <ThemedSider {...props} fixed />}
                          Title={(props) => (
                            <ThemedTitle {...props} text="Luna Tech" />
                          )}
                        >
                          <Outlet />
                        </ThemedLayout>
                      </Authenticated>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="/quote" element={<Quote />} />

                    <Route path="/repairs">
                      <Route index element={<RepairOrderList />} />
                      <Route path="create" element={<RepairOrderCreate />} />
                      <Route path="edit/:id" element={<RepairOrderEdit />} />
                      <Route path="show/:id" element={<RepairOrderShow />} />
                    </Route>
                    <Route path="/sales">
                      <Route index element={<SalesOrderList />} />
                      <Route path="create" element={<SalesOrderCreate />} />
                      <Route path="show/:id" element={<SalesOrderShow />} />
                    </Route>
                    <Route path="/customers">
                      <Route index element={<CustomerList />} />
                      <Route path="create" element={<CustomerCreate />} />
                      <Route path="edit/:id" element={<CustomerEdit />} />
                      <Route path="show/:id" element={<CustomerShow />} />
                    </Route>
                    <Route path="/warranties">
                      <Route index element={<WarrantyList />} />
                      <Route path="show/:id" element={<WarrantyShow />} />
                    </Route>
                    <Route path="/inventory_components">
                      <Route index element={<InventoryComponentsList />} />
                      <Route
                        path="create"
                        element={<InventoryComponentsCreate />}
                      />
                      <Route
                        path="edit/:id"
                        element={<InventoryComponentsEdit />}
                      />
                      <Route
                        path="show/:id"
                        element={<InventoryComponentsShow />}
                      />
                    </Route>
                    <Route path="/inventory_items">
                      <Route index element={<InventoryItemsList />} />
                      <Route path="create" element={<InventoryItemsCreate />} />
                      <Route path="edit/:id" element={<InventoryItemsEdit />} />
                      <Route path="show/:id" element={<InventoryItemsShow />} />
                    </Route>
                    {/* 供应链 */}
                    <Route path="/supply-chain">
                      <Route path="orders">
                        <Route index element={<PurchaseOrderList />} />
                        <Route
                          path="create"
                          element={<PurchaseOrderCreate />}
                        />
                        <Route
                          path="edit/:id"
                          element={<PurchaseOrderEdit />}
                        />
                        <Route
                          path="show/:id"
                          element={<PurchaseOrderShow />}
                        />
                      </Route>
                      <Route path="entries">
                        <Route index element={<StockEntriesList />} />
                        <Route path="create" element={<StockEntriesCreate />} />
                        <Route path="show/:id" element={<StockEntriesShow />} />
                      </Route>
                    </Route>

                    {/* 供应商 */}
                    <Route path="/suppliers">
                      <Route index element={<SupplierList />} />
                      <Route path="create" element={<SupplierCreate />} />
                      <Route path="edit/:id" element={<SupplierEdit />} />
                      <Route path="show/:id" element={<SupplierShow />} />
                    </Route>
                    {/* 财务 */}
                    <Route path="/finance">
                      <Route path="transactions">
                        <Route index element={<TransactionsList />} />
                        <Route path="create" element={<TransactionsCreate />} />
                      </Route>
                    </Route>

                    {/* 设置 */}
                    <Route path="/settings">
                      <Route path="models">
                        <Route index element={<DeviceModelList />} />
                        <Route path="create" element={<DeviceModelCreate />} />
                        <Route path="edit/:id" element={<DeviceModelEdit />} />
                        <Route path="show/:id" element={<DeviceModelShow />} />
                      </Route>
                      <Route path="categories">
                        <Route index element={<CategoryList />} />
                        <Route path="create" element={<CategoryCreate />} />
                        <Route path="edit/:id" element={<CategoryEdit />} />
                        <Route path="show/:id" element={<CategoryShow />} />
                      </Route>
                      <Route path="faults">
                        <Route index element={<FaultList />} />
                        <Route path="create" element={<FaultCreate />} />
                        <Route path="edit/:id" element={<FaultEdit />} />
                        <Route path="show/:id" element={<FaultShow />} />
                      </Route>
                      <Route path="staff">
                        <Route index element={<ProfileList />} />
                        <Route path="create" element={<ProfileCreate />} />
                        <Route path="edit/:id" element={<ProfileEdit />} />
                      </Route>
                    </Route>

                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-outer"
                        fallback={<Outlet />}
                      >
                        <NavigateToResource />
                      </Authenticated>
                    }
                  >
                    <Route
                      path="/login"
                      element={
                        <AuthPage
                          type="login"
                          registerLink={false}
                          title="Luna Tech Admin"
                          formProps={{
                            initialValues: {
                              email: "info@refine.dev",
                              password: "refine-supabase",
                            },
                          }}
                        />
                      }
                    />
                    <Route
                      path="/forgot-password"
                      element={
                        <AuthPage
                          title="Luna Tech Admin"
                          type="forgotPassword"
                        />
                      }
                    />
                  </Route>
                </Routes>

                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
