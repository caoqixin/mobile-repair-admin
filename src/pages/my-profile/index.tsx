import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Tabs,
  List,
  Tag,
  Modal,
  TabsProps,
} from "antd";
import { useLogout, useNotification, useTranslate } from "@refinedev/core";
import { supabaseClient } from "../../providers/supabase-client";

export const MyProfile: React.FC = () => {
  const t = useTranslate();
  const { open } = useNotification();
  const { mutate: logout } = useLogout();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // MFA 状态
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [enrolledFactorId, setEnrolledFactorId] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [mfaModalVisible, setMfaModalVisible] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [mfaForm] = Form.useForm();

  // 获取 MFA 状态
  const checkMfaStatus = async () => {
    const { data, error } = await supabaseClient.auth.mfa.listFactors();
    if (error) return;

    // 检查是否有已验证的 TOTP
    const totpFactor = data.totp.find((f) => f.status === "verified");
    if (totpFactor) {
      setMfaEnabled(true);
      setEnrolledFactorId(totpFactor.id);
    } else {
      setMfaEnabled(false);
      setEnrolledFactorId(null);
    }
  };

  useEffect(() => {
    checkMfaStatus();
  }, []);

  // 开启 MFA (第一步：获取二维码)
  const handleEnableMfa = async () => {
    setVerifyLoading(true);

    try {
      // 获取当前用户所有的 MFA factors
      const { data: factorsData, error: listError } =
        await supabaseClient.auth.mfa.listFactors();
      if (listError) throw listError;

      //  找出所有状态为 'unverified' (未验证) 的垃圾 Factor
      const unverifiedFactors = factorsData.all.filter(
        (factory) => factory.status === "unverified",
      );

      // 循环清理掉这些未验证的 Factor
      for (const factor of unverifiedFactors) {
        await supabaseClient.auth.mfa.unenroll({ factorId: factor.id });
      }

      const { data, error: enrollError } = await supabaseClient.auth.mfa.enroll(
        {
          factorType: "totp",
        },
      );

      if (enrollError) throw enrollError;

      setEnrolledFactorId(data.id);
      setQrCodeData(data.totp.qr_code); // 这是一个 SVG 字符串
      setMfaModalVisible(true);
    } catch {
      open?.({
        type: "error",
        message: t("pages.myProfile.message.qr_code_error"),
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  // 验证 MFA (第二步：输入验证码确认绑定)
  const handleVerifyMfa = async (values: any) => {
    if (!enrolledFactorId) return;
    setVerifyLoading(true);

    try {
      const challenge = await supabaseClient.auth.mfa.challenge({
        factorId: enrolledFactorId,
      });
      if (challenge.error) throw challenge.error;

      const verify = await supabaseClient.auth.mfa.verify({
        factorId: enrolledFactorId,
        challengeId: challenge.data.id,
        code: values.code,
      });

      if (verify.error) throw verify.error;

      open?.({
        type: "success",
        message: t("pages.myProfile.message.mfa_enable_success"),
      });
      setMfaEnabled(true);
      setMfaModalVisible(false);
      mfaForm.resetFields();

      logout();
    } catch {
      open?.({
        type: "error",
        message: t("pages.myProfile.message.mfa_enable_error"),
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  // 关闭/解绑 MFA
  const handleDisableMfa = async () => {
    if (!enrolledFactorId) return;
    const { error } = await supabaseClient.auth.mfa.unenroll({
      factorId: enrolledFactorId,
    });

    if (error) {
      open?.({
        type: "error",
        message: t("pages.myProfile.message.disable_error", {
          error: error.message,
        }),
      });
    } else {
      open?.({
        type: "success",
        message: t("pages.myProfile.message.disable_success"),
      });
      setMfaEnabled(false);
      setEnrolledFactorId(null);
    }
  };

  // 处理修改密码逻辑
  const handleUpdatePassword = async (values: any) => {
    setLoading(true);
    const { error } = await supabaseClient.auth.updateUser({
      password: values.newPassword,
    });
    setLoading(false);

    if (error) {
      open?.({
        type: "error",
        message: t("pages.myProfile.message.error", { error: error.message }),
      });
    } else {
      open?.({
        type: "success",
        message: t("pages.myProfile.message.success"),
      });
      form.resetFields();

      // 重新登录
      logout();
    }
  };

  const items: TabsProps["items"] = [
    {
      key: "security",
      label: t("pages.myProfile.tabs.security"),
      children: (
        <>
          {/* 修改密码卡片 */}
          <Card
            title={t("pages.myProfile.password.title")}
            variant="borderless"
            style={{ marginBottom: 24 }}
          >
            <Form form={form} layout="vertical" onFinish={handleUpdatePassword}>
              <Form.Item
                name="newPassword"
                label={t("pages.myProfile.password.new")}
                rules={[
                  {
                    required: true,
                    message: t("pages.myProfile.password.rules.new"),
                  },
                  {
                    min: 6,
                    message: t("pages.myProfile.password.rules.length"),
                  },
                ]}
              >
                <Input.Password
                  placeholder={t("pages.myProfile.password.placeholder.new")}
                  size="large"
                />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label={t("pages.myProfile.password.confirm")}
                dependencies={["newPassword"]}
                rules={[
                  {
                    required: true,
                    message: t("pages.myProfile.password.rules.confirm"),
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(t("pages.myProfile.message.confirm")),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder={t(
                    "pages.myProfile.password.placeholder.confirm",
                  )}
                  size="large"
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
              >
                {t("buttons.save")}
              </Button>
            </Form>
          </Card>

          {/* MFA 管理卡片 */}
          <Card title={t("pages.myProfile.mfa.title")} variant="borderless">
            <List
              itemLayout="horizontal"
              dataSource={[
                {
                  title: (
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {t("pages.myProfile.mfa.dataTitle")}
                      {mfaEnabled ? (
                        <Tag color="success">
                          {t("pages.myProfile.tags.enabled")}
                        </Tag>
                      ) : (
                        <Tag color="default">
                          {t("pages.myProfile.tags.disabled")}
                        </Tag>
                      )}
                    </span>
                  ),
                  description: t("pages.myProfile.mfa.description"),
                },
              ]}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    mfaEnabled ? (
                      <Button
                        danger
                        type="primary"
                        ghost
                        onClick={handleDisableMfa}
                        key="disable"
                      >
                        {t("pages.myProfile.buttons.disable")}
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        ghost
                        onClick={handleEnableMfa}
                        key="enable"
                        loading={verifyLoading}
                      >
                        {t("pages.myProfile.buttons.enable")}
                      </Button>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <Typography.Title level={3}>
        {t("pages.myProfile.title")}
      </Typography.Title>

      <Tabs defaultActiveKey="security" items={items}></Tabs>

      {/* MFA 绑定弹窗 */}
      <Modal
        title={t("pages.myProfile.modal.title")}
        open={mfaModalVisible}
        onCancel={() => {
          setMfaModalVisible(false);
          mfaForm.resetFields();
        }}
        footer={null}
        destroyOnHidden
      >
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <Typography.Paragraph>
            {t("pages.myProfile.modal.first_desc")}
          </Typography.Paragraph>

          {/* 渲染 Supabase 返回的 SVG 二维码 */}
          {qrCodeData && <img src={qrCodeData} />}

          <Typography.Paragraph>
            {t("pages.myProfile.modal.second_desc")}
          </Typography.Paragraph>

          <Form form={mfaForm} layout="vertical" onFinish={handleVerifyMfa}>
            <Form.Item
              name="code"
              rules={[
                { required: true, message: t("pages.myProfile.modal.rule") },
              ]}
            >
              <Input
                size="large"
                placeholder={t("pages.myProfile.modal.placeholder")}
                maxLength={6}
                style={{
                  textAlign: "center",
                  letterSpacing: "8px",
                  fontSize: "20px",
                }}
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={verifyLoading}
            >
              {t("pages.myProfile.modal.button")}
            </Button>
          </Form>
        </div>
      </Modal>
    </div>
  );
};
