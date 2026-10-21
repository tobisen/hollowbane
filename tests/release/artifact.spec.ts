import { expect, test } from "@playwright/test";

test("application loads the exact release SHA without browser errors", async ({
  page,
  request,
}) => {
  const sha = process.env.RELEASE_SHA;
  expect(sha).toMatch(/^[a-f0-9]{40}$/);
  const response = await request.get(`./release.json?sha=${sha}`, {
    headers: { "Cache-Control": "no-cache" },
  });
  expect(response.ok()).toBe(true);
  expect((await response.json()).sha).toBe(sha);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (r) => errors.push(r.url()));
  expect((await page.goto("./?metrics=1"))?.ok()).toBe(true);
  await expect(page.locator("html")).toHaveAttribute(
    "data-prototype-ready",
    "true",
  );
  await expect(page.locator("#world canvas")).toBeVisible();
  await expect(page.locator("#world-metrics")).toContainText("PHASER 4.2.1");
  expect(errors).toEqual([]);
});
