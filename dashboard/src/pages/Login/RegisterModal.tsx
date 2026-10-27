import { useRef, useState } from "react";
import { Button, Form, Input, Modal, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { authApi } from "../../api/modules/auth";
import { apiErrorMessage } from "../../utils/apiError";
import { message } from "@/utils/antdMessage";
import CaptchaField, { type CaptchaFieldHandle } from "./CaptchaField";
import { type PublicCaptchaConfig } from "./captchaAdapters";

interface Fields {
  username: string;
  display_name?: string;
  password: string;
  confirm: string;
}

export default function RegisterModal({
  captcha,
  onClose,
  onCreated,
}: {
  captcha: PublicCaptchaConfig;
  onClose: () => void;
  onCreated: (username: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm<Fields>();
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [reset, setReset] = useState(0);
  const captchaRef = useRef<CaptchaFieldHandle>(null);

  const submit = async (values: Fields) => {
    if (busy || !ready) return;
    setBusy(true);
    try {
      const captcha_token = await captchaRef.current?.getToken();
      const result = await authApi.register({
        username: values.username,
        password: values.password,
        display_name: values.display_name?.trim() || undefined,
        locale: i18n.resolvedLanguage || i18n.language || "en",
        captcha_token,
      });
      form.resetFields();
      onCreated(result.username);
    } catch (error) {
      message.error(apiErrorMessage(error, t("login.registration.failed"), t));
      setReady(false);
      setReset((current) => current + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title={t("login.registration.open")}
      onCancel={onClose}
      closable={!busy}
      maskClosable={!busy}
      keyboard={!busy}
      footer={null}
      centered
    >
      <Typography.Paragraph>
        {t("login.registration.intro")}
      </Typography.Paragraph>
      <Form form={form} layout="vertical" onFinish={submit} disabled={busy}>
        <Form.Item
          name="username"
          label={t("account.username")}
          rules={[
            { required: true, message: t("login.registration.required") },
            {
              pattern: /^[A-Za-z0-9][A-Za-z0-9_.-]{2,63}$/,
              message: t("login.registration.usernameHint"),
            },
          ]}
        >
          <Input autoComplete="username" maxLength={64} />
        </Form.Item>
        <Form.Item
          name="display_name"
          label={t("login.registration.displayName")}
        >
          <Input autoComplete="nickname" maxLength={80} />
        </Form.Item>
        <Form.Item
          name="password"
          label={t("login.password")}
          rules={[
            { required: true, message: t("login.registration.required") },
            { min: 8, max: 200, message: t("login.registration.passwordHint") },
            {
              pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
              message: t("login.registration.passwordHint"),
            },
          ]}
        >
          <Input.Password autoComplete="new-password" maxLength={200} />
        </Form.Item>
        <Form.Item
          name="confirm"
          label={t("login.registration.confirm")}
          dependencies={["password"]}
          rules={[
            { required: true, message: t("login.registration.required") },
            ({ getFieldValue }) => ({
              validator(_, value) {
                return !value || value === getFieldValue("password")
                  ? Promise.resolve()
                  : Promise.reject(new Error(t("login.registration.mismatch")));
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" maxLength={200} />
        </Form.Item>
        <CaptchaField
          ref={captchaRef}
          config={captcha}
          resetKey={reset}
          slideHint={t("login.slideHint")}
          slideVerifiedLabel={t("login.slideVerified")}
          unsupportedLabel={t("login.unsupportedCaptcha")}
          onReadyChange={setReady}
        />
        <Button
          block
          type="primary"
          htmlType="submit"
          loading={busy}
          disabled={!ready}
          style={{ marginTop: 20 }}
        >
          {t("login.registration.open")}
        </Button>
      </Form>
    </Modal>
  );
}
