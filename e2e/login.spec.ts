import { test, expect } from "@playwright/test";

/**
 * End-to-end coverage for the login flow described in Section 5.4.3 of the report:
 * - the login form renders correctly
 * - an incorrect password is rejected with the correct inline error message
 * - valid credentials advance the user to the six-digit One-Time Password step
 *
 * Exercises the full round trip from the browser, through the Vite dev-server proxy
 * (/api -> http://127.0.0.1:8000), to the FastAPI /auth/login endpoint and the
 * PostgreSQL database, and back to a rendered UI state change.
 */

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@healthprime.sa";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "ChangeMe123!";

test.describe("Login flow", () => {
  test("renders the login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByLabel("Email Address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("rejects an incorrect password with an inline error", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email Address").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill("definitely-the-wrong-password");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    // Should still be on the login form, not advanced to the OTP step.
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("advances to the six-digit OTP step on valid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email Address").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    // The OTP screen renders a 6-slot one-time-password input and a "Verify OTP" button.
    await expect(page.getByText("Enter OTP code sent to your email")).toBeVisible();
    await expect(page.getByText("A 6-digit code was sent to your email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Verify OTP" })).toBeVisible();
  });
});
