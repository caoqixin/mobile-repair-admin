import React from "react";
import {
  Authenticated,
  CanAccess,
  I18nProvider,
  Refine,
} from "@refinedev/core";

import { ErrorComponent, useNotificationProvider } from "@refinedev/antd";
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
import { CategoryCreate, CategoryEdit, CategoryList } from "./pages/categories";
import authProvider from "./providers/auth";
import { dataProvider } from "./providers/data";
import { supabaseClient } from "./providers/supabase-client";
import { useTranslation } from "react-i18next";
import { ThemedLayout } from "./components/layout";
import { ThemedSider } from "./components/layout/sider";
import { ThemedTitle } from "./components/layout/title";
import { resources } from "./resources";
import { customTitleHandler } from "./lib/customTitleHandler";
import { accessControlProvider } from "./providers/accessControlProvider";
import { AccessDenied } from "./components/error/auth";
import { LayoutLoading } from "./components/loadings";

// lazy load
// Dashboard
const Dashboard = React.lazy(() =>
  import("./pages/dashboard").then((module) => ({ default: module.Dashboard })),
);

// Quote
const Quote = React.lazy(() =>
  import("./pages/quote/list").then((module) => ({ default: module.Quote })),
);

// Repair Orders
const RepairOrderCreate = React.lazy(() =>
  import("./pages/repair-orders").then((module) => ({
    default: module.RepairOrderCreate,
  })),
);
const RepairOrderEdit = React.lazy(() =>
  import("./pages/repair-orders").then((module) => ({
    default: module.RepairOrderEdit,
  })),
);
const RepairOrderList = React.lazy(() =>
  import("./pages/repair-orders").then((module) => ({
    default: module.RepairOrderList,
  })),
);
const RepairOrderShow = React.lazy(() =>
  import("./pages/repair-orders").then((module) => ({
    default: module.RepairOrderShow,
  })),
);

// Sales Orders
const SalesOrderCreate = React.lazy(() =>
  import("./pages/sales-orders").then((module) => ({
    default: module.SalesOrderCreate,
  })),
);
const SalesOrderList = React.lazy(() =>
  import("./pages/sales-orders").then((module) => ({
    default: module.SalesOrderList,
  })),
);
const SalesOrderShow = React.lazy(() =>
  import("./pages/sales-orders").then((module) => ({
    default: module.SalesOrderShow,
  })),
);

// Customers
const CustomerCreate = React.lazy(() =>
  import("./pages/customers").then((module) => ({
    default: module.CustomerCreate,
  })),
);
const CustomerEdit = React.lazy(() =>
  import("./pages/customers").then((module) => ({
    default: module.CustomerEdit,
  })),
);
const CustomerList = React.lazy(() =>
  import("./pages/customers").then((module) => ({
    default: module.CustomerList,
  })),
);
const CustomerShow = React.lazy(() =>
  import("./pages/customers").then((module) => ({
    default: module.CustomerShow,
  })),
);

// Inventory Components
const InventoryComponentsCreate = React.lazy(() =>
  import("./pages/inventory-components").then((module) => ({
    default: module.InventoryComponentsCreate,
  })),
);
const InventoryComponentsEdit = React.lazy(() =>
  import("./pages/inventory-components").then((module) => ({
    default: module.InventoryComponentsEdit,
  })),
);
const InventoryComponentsList = React.lazy(() =>
  import("./pages/inventory-components").then((module) => ({
    default: module.InventoryComponentsList,
  })),
);
const InventoryComponentsShow = React.lazy(() =>
  import("./pages/inventory-components").then((module) => ({
    default: module.InventoryComponentsShow,
  })),
);

// Inventory Items
const InventoryItemsCreate = React.lazy(() =>
  import("./pages/inventory-items").then((module) => ({
    default: module.InventoryItemsCreate,
  })),
);
const InventoryItemsEdit = React.lazy(() =>
  import("./pages/inventory-items").then((module) => ({
    default: module.InventoryItemsEdit,
  })),
);
const InventoryItemsList = React.lazy(() =>
  import("./pages/inventory-items").then((module) => ({
    default: module.InventoryItemsList,
  })),
);
const InventoryItemsShow = React.lazy(() =>
  import("./pages/inventory-items").then((module) => ({
    default: module.InventoryItemsShow,
  })),
);

// Purchase Orders
const PurchaseOrderCreate = React.lazy(() =>
  import("./pages/purchase-orders").then((module) => ({
    default: module.PurchaseOrderCreate,
  })),
);
const PurchaseOrderEdit = React.lazy(() =>
  import("./pages/purchase-orders").then((module) => ({
    default: module.PurchaseOrderEdit,
  })),
);
const PurchaseOrderList = React.lazy(() =>
  import("./pages/purchase-orders").then((module) => ({
    default: module.PurchaseOrderList,
  })),
);
const PurchaseOrderShow = React.lazy(() =>
  import("./pages/purchase-orders").then((module) => ({
    default: module.PurchaseOrderShow,
  })),
);

// Stock Entries
const StockEntriesCreate = React.lazy(() =>
  import("./pages/stock-entries").then((module) => ({
    default: module.StockEntriesCreate,
  })),
);
const StockEntriesList = React.lazy(() =>
  import("./pages/stock-entries").then((module) => ({
    default: module.StockEntriesList,
  })),
);
const StockEntriesShow = React.lazy(() =>
  import("./pages/stock-entries").then((module) => ({
    default: module.StockEntriesShow,
  })),
);

// Suppliers
const SupplierCreate = React.lazy(() =>
  import("./pages/suppliers").then((module) => ({
    default: module.SupplierCreate,
  })),
);
const SupplierEdit = React.lazy(() =>
  import("./pages/suppliers").then((module) => ({
    default: module.SupplierEdit,
  })),
);
const SupplierList = React.lazy(() =>
  import("./pages/suppliers").then((module) => ({
    default: module.SupplierList,
  })),
);

// Transactions
const TransactionsCreate = React.lazy(() =>
  import("./pages/transactions").then((module) => ({
    default: module.TransactionsCreate,
  })),
);
const TransactionsList = React.lazy(() =>
  import("./pages/transactions").then((module) => ({
    default: module.TransactionsList,
  })),
);

// Device Models
const DeviceModelCreate = React.lazy(() =>
  import("./pages/device-models").then((module) => ({
    default: module.DeviceModelCreate,
  })),
);
const DeviceModelEdit = React.lazy(() =>
  import("./pages/device-models").then((module) => ({
    default: module.DeviceModelEdit,
  })),
);
const DeviceModelList = React.lazy(() =>
  import("./pages/device-models").then((module) => ({
    default: module.DeviceModelList,
  })),
);
const DeviceModelShow = React.lazy(() =>
  import("./pages/device-models").then((module) => ({
    default: module.DeviceModelShow,
  })),
);

// Faults
const FaultCreate = React.lazy(() =>
  import("./pages/faults").then((module) => ({ default: module.FaultCreate })),
);
const FaultEdit = React.lazy(() =>
  import("./pages/faults").then((module) => ({ default: module.FaultEdit })),
);
const FaultList = React.lazy(() =>
  import("./pages/faults").then((module) => ({ default: module.FaultList })),
);

// Profiles
const ProfileCreate = React.lazy(() =>
  import("./pages/profiles").then((module) => ({
    default: module.ProfileCreate,
  })),
);
const ProfileEdit = React.lazy(() =>
  import("./pages/profiles").then((module) => ({
    default: module.ProfileEdit,
  })),
);
const ProfileList = React.lazy(() =>
  import("./pages/profiles").then((module) => ({
    default: module.ProfileList,
  })),
);

// Warranties
const WarrantyList = React.lazy(() =>
  import("./pages/warranties").then((module) => ({
    default: module.WarrantyList,
  })),
);
const WarrantyShow = React.lazy(() =>
  import("./pages/warranties").then((module) => ({
    default: module.WarrantyShow,
  })),
);

// Auth Page
const AuthPage = React.lazy(() =>
  import("./components/pages/auth").then((module) => ({
    default: module.AuthPage,
  })),
);

// My Profile
const MyProfile = React.lazy(() =>
  import("./pages/my-profile").then((module) => ({
    default: module.MyProfile,
  })),
);

const MfaVerifyPage = React.lazy(() =>
  import("./components/pages/auth/components/mfa-verify").then((module) => ({
    default: module.MfaVerifyPage,
  })),
);

function App() {
  const { t, i18n } = useTranslation();

  const i18nProvider: I18nProvider = {
    translate: (key: string, options?: any) => t(key, options) as string,
    changeLocale: (lang: string) => i18n.changeLanguage(lang),
    getLocale: () => i18n.language,
  };

  return (
    <BrowserRouter>
      <ColorModeContextProvider>
        <AntdApp>
          <Refine
            dataProvider={dataProvider}
            liveProvider={liveProvider(supabaseClient)}
            authProvider={authProvider}
            routerProvider={routerProvider}
            notificationProvider={useNotificationProvider}
            accessControlProvider={accessControlProvider}
            i18nProvider={i18nProvider}
            resources={resources}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
              projectId: "JXabbB-6wc3D6-tgE9yj",
              liveMode: "auto",
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
                      <CanAccess fallback={<AccessDenied />}>
                        <React.Suspense fallback={<LayoutLoading />}>
                          <Outlet />
                        </React.Suspense>
                      </CanAccess>
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
                    <Route path="create" element={<PurchaseOrderCreate />} />
                    <Route path="edit/:id" element={<PurchaseOrderEdit />} />
                    <Route path="show/:id" element={<PurchaseOrderShow />} />
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
                  </Route>
                  <Route path="faults">
                    <Route index element={<FaultList />} />
                    <Route path="create" element={<FaultCreate />} />
                    <Route path="edit/:id" element={<FaultEdit />} />
                  </Route>
                  <Route path="staff">
                    <Route index element={<ProfileList />} />
                    <Route path="create" element={<ProfileCreate />} />
                    <Route path="edit/:id" element={<ProfileEdit />} />
                  </Route>
                </Route>

                {/* 个人中心 */}
                <Route path="/my" element={<MyProfile />} />

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
                    />
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <AuthPage title="Luna Tech Admin" type="forgotPassword" />
                  }
                />
                <Route
                  path="/update-password"
                  element={
                    <AuthPage title="Luna Tech Admin" type="updatePassword" />
                  }
                />
                <Route path="/mfa-verify" element={<MfaVerifyPage />} />
              </Route>
            </Routes>

            <UnsavedChangesNotifier />
            <DocumentTitleHandler handler={customTitleHandler} />
          </Refine>
        </AntdApp>
      </ColorModeContextProvider>
    </BrowserRouter>
  );
}

export default App;
