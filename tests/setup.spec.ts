import { test, expect, Page } from "@playwright/test";

test.describe("Setup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Get started" }).click();
  });

  test("setup new identity", async ({ page }) => {
    await page.getByLabel("Your name").fill("Sophie");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("Generate")).toBeVisible();

    // After a few seconds, the identity should be generated
    await expect(page.getByRole("button", { name: "Download" })).toBeVisible();
    expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
    // Download the identity
    await page.getByRole("button", { name: "Download" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page).toHaveURL("/#/");
  });

  test("forces the user to enter a name", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
    // Should be enabled with a single character
    await page.getByLabel("Your name").fill("Y");
    await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();
    await page.getByLabel("Your name").fill("");
    await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});
