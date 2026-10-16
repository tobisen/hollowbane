import { expect, it, vi } from "vitest";
interface RecordData {
  number: number;
  title?: string;
  name?: string;
  body?: string;
  labels?: { name: string }[];
  milestone?: { number: number };
}
it("resumes an interrupted GitHub import and creates no duplicates on rerun", async () => {
  const argv = process.argv;
  const collections: Record<string, RecordData[]> = {
    labels: [],
    milestones: [],
    issues: [],
  };
  let failOnce = true;
  vi.stubEnv("GITHUB_TOKEN", "local-test-token");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, options: { method: string; body?: string }) => {
      const url = new URL(input);
      expect(url.host).toBe("api.github.com");
      const resource = url.pathname.split("/")[4]!;
      const collection = collections[resource];
      if (!collection) throw new Error("Unexpected resource");
      if (options.method === "GET") {
        const offset = (Number(url.searchParams.get("page")) - 1) * 100;
        return new Response(
          JSON.stringify(collection.slice(offset, offset + 100)),
          { status: 200 },
        );
      }
      if (resource === "issues" && collection.length === 37 && failOnce) {
        failOnce = false;
        return new Response("{}", { status: 429 });
      }
      const body = JSON.parse(options.body!);
      const record = {
        ...body,
        number: collection.length + 1,
        ...(body.labels
          ? {
              labels: body.labels.map((name: string) => ({ name })),
              milestone: { number: body.milestone },
            }
          : {}),
      };
      collection.push(record);
      return new Response(JSON.stringify(record), { status: 201 });
    }),
  );
  process.argv = ["node", "scripts/import-github.mjs", "--apply"];
  const modulePath = "../scripts/import-github.mjs";
  try {
    await expect(import(modulePath)).rejects.toThrow("429");
    vi.resetModules();
    await import(modulePath);
    expect(collections.issues).toHaveLength(231);
    expect(collections.milestones).toHaveLength(36);
    expect(collections.labels).toHaveLength(52);
    vi.resetModules();
    await import(modulePath);
    expect(collections.issues).toHaveLength(231);
    expect(collections.milestones).toHaveLength(36);
    expect(new Set(collections.issues!.map((i) => i.title))).toHaveProperty(
      "size",
      231,
    );
  } finally {
    process.argv = argv;
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  }
});
