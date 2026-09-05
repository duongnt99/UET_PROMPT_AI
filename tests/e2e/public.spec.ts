import { test, expect } from "@playwright/test";

test("public homepage renders Vietnamese content", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Prompt-Off: Vietnam 2026/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Đăng ký ngay" }).first()).toBeVisible();
  await expect(page.getByText("8 đội", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("không bye", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Tính khả thi")).toBeVisible();
  await expect(page.getByText("40%").first()).toBeVisible();
});

test("login page is available", async ({ page }) => {
  await page.goto("/dang-nhap");
  await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
});

test("participant can sign in to dashboard", async ({ page }) => {
  await page.goto("/dang-nhap");
  await page.getByLabel("Email").fill("student1@promptoff.local");
  await page.getByLabel("Mật khẩu").fill("DevPassword123!");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /Xin chào/ })).toBeVisible();
});

test("public scoreboard does not expose participant emails", async ({ page }) => {
  await page.goto("/scoreboard");
  await expect(page.getByRole("heading", { name: "Scoreboard" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("@promptoff.local");
});

test("public finalists page does not expose emails", async ({ page }) => {
  await page.goto("/finalists");
  await expect(page.locator("body")).not.toContainText("@promptoff.local");
});
