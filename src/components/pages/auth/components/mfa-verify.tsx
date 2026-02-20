import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Layout,
  Row,
  Col,
} from "antd";
import { supabaseClient } from "../../../../providers/supabase-client";
import { IProfile } from "../../../../interface";
import { useAuthStore } from "../../../../stores/authStore";
import { useGo, useTranslate } from "@refinedev/core";

export const MfaVerifyPage: React.FC = () => {
  const t = useTranslate();
  const [factorId, setFactorId] = useState("");
  const [loading, setLoading] = useState(false);
  const go = useGo();

  useEffect(() => {
    // 页面加载时，自动获取 MFA Factor ID 并发起 Challenge
    const initMfa = async () => {
      const { data, error } = await supabaseClient.auth.mfa.listFactors();
      if (error) throw error;

      const totpFactor = data.totp[0];
      if (!totpFactor) {
        // 异常情况：没有找到 TOTP，回退到登录页
        go({
          to: "/login",
        });
        return;
      }
      setFactorId(totpFactor.id);
    };
    initMfa();
  }, [go]);

  const onFinish = async (values: { code: string }) => {
    setLoading(true);
    try {
      // 1. 发起挑战 (获取 challenge_id)
      const challenge = await supabaseClient.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      // 2. 验证验证码
      const verify = await supabaseClient.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: values.code,
      });

      if (verify.error) throw verify.error;

      // 3. 验证成功！获取完整的用户信息并存入 Store
      const { data: sessionData } = await supabaseClient.auth.getSession();
      if (sessionData.session?.user) {
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", sessionData.session.user.id)
          .single<IProfile>();

        if (profile) {
          useAuthStore.getState().setAuth(profile);
          // 跳转逻辑
          let redirectTo = "/";
          if (profile.role === "front_desk") redirectTo = "/sales/create";
          else if (profile.role === "technician") redirectTo = "/repairs";
          else if (profile.role === "partner") redirectTo = "/quote";
          go({
            to: redirectTo,
          });
        }
      }
    } catch (error: any) {
      message.error(
        error.message || t("pages.myProfile.message.verify_code_error"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <Row justify="center" align="middle" style={{ flex: 1 }}>
        <Col xs={22} sm={16} md={12} lg={8}>
          <Card
            variant="borderless"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
          >
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Typography.Title level={3}>
                {t("pages.myProfile.verify.title")}
              </Typography.Title>
              <Typography.Text type="secondary">
                {t("pages.myProfile.verify.description")}
              </Typography.Text>
            </div>

            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item
                name="code"
                rules={[
                  {
                    required: true,
                    message: t("pages.myProfile.verify.rules.codeRequired"),
                  },
                  {
                    len: 6,
                    message: t("pages.myProfile.verify.rules.codeLen"),
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder={t("pages.myProfile.verify.placeholder.code")}
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
                size="large"
                htmlType="submit"
                loading={loading}
                block
              >
                {t("pages.myProfile.verify.button.submit")}
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};
