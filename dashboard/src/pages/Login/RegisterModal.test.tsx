import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const register = vi.hoisted(() => vi.fn());
const showError = vi.hoisted(() => vi.fn());
vi.mock("@/utils/antdMessage", () => ({ message: { error: showError } }));
vi.mock("../../api/modules/auth", () => ({ authApi: { register } }));
vi.mock("./CaptchaField", async () => {
  const { forwardRef, useEffect, useImperativeHandle } = await import("react");
  return {
    default: forwardRef(function Captcha(
      { onReadyChange }: { onReadyChange: (ready: boolean) => void },
      ref,
    ) {
      useEffect(() => onReadyChange(true), [onReadyChange]);
      useImperativeHandle(ref, () => ({
        getToken: async () => "verified-captcha",
      }));
      return null;
    }),
  };
});

import RegisterModal from "./RegisterModal";

beforeEach(() => {
  register.mockReset();
  showError.mockReset();
});

async function fill(password: string, confirmation: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("account.username"), "new_user");
  await user.type(screen.getByLabelText("login.password"), password);
  await user.type(
    screen.getByLabelText("login.registration.confirm"),
    confirmation,
  );
  await user.click(
    screen.getByRole("button", { name: "login.registration.open" }),
  );
}

describe("Public account creation", () => {
  it("submits only personal fields and returns to sign-in after creation", async () => {
    register.mockResolvedValue({ username: "new_user" });
    const onCreated = vi.fn();
    render(
      <RegisterModal
        captcha={{ provider: "none" }}
        onClose={vi.fn()}
        onCreated={onCreated}
      />,
    );
    await fill("NewUserPass42", "NewUserPass42");
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith("new_user"));
    expect(register).toHaveBeenCalledWith({
      username: "new_user",
      password: "NewUserPass42",
      display_name: undefined,
      locale: "zh",
      captcha_token: "verified-captcha",
    });
  });

  it("does not submit mismatched passwords", async () => {
    render(
      <RegisterModal
        captcha={{ provider: "none" }}
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />,
    );
    await fill("NewUserPass42", "DifferentPass42");
    expect(
      await screen.findByText("login.registration.mismatch"),
    ).toBeVisible();
    expect(register).not.toHaveBeenCalled();
  });

  it("keeps the form open when registration is rejected", async () => {
    register.mockRejectedValue(new Error("username unavailable"));
    const onCreated = vi.fn();
    render(
      <RegisterModal
        captcha={{ provider: "none" }}
        onClose={vi.fn()}
        onCreated={onCreated}
      />,
    );
    await fill("NewUserPass42", "NewUserPass42");
    await waitFor(() => expect(register).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(showError).toHaveBeenCalledWith("username unavailable"),
    );
    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
    expect(onCreated).not.toHaveBeenCalled();
  });
});
