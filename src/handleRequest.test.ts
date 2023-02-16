import { handleRequest } from "./handleRequest";
import { describe, test, expect } from "vitest";
import { createMockContext } from "./createMockContext";
import { loadRoutes } from "./loadRoutes";
import { resolve } from "path";

describe("handleRequest", () => {
  test("null when no route matches", async () => {
    const routes = await loadRoutes({
      routesDirectory: resolve(__dirname, "..", "fixtures", "routes1"),
    });
    await expect(
      handleRequest(
        createMockContext({
          url: "/auth/asd",
        }),
        routes
      )
    ).resolves.toEqual(null);
  });
  test("returns what the route returns", async () => {
    const routes = await loadRoutes({
      routesDirectory: resolve(__dirname, "..", "fixtures", "routes1"),
    });
    await expect(
      handleRequest(
        createMockContext({
          url: "/auth/bar",
        }),
        routes
      )
    ).resolves.toEqual({
      value: { baz: true },
    });
  });
  test("throws if the route throws", async () => {
    const routes = await loadRoutes({
      routesDirectory: resolve(__dirname, "..", "fixtures", "routes2"),
    });
    await expect(
      handleRequest(
        createMockContext({
          url: "/auth/throw",
        }),
        routes
      )
    ).rejects.toThrow("BAD");
  });
  test("works with params", async () => {
    const routes = await loadRoutes({
      routesDirectory: resolve(__dirname, "..", "fixtures", "routes2"),
    });
    await expect(
      handleRequest(
        createMockContext({
          url: "/auth/param/7",
        }),
        routes
      )
    ).resolves.toEqual({ value: { id: "7" } });
  });
  test("works with middleware", async () => {
    const routes = await loadRoutes({
      routesDirectory: resolve(__dirname, "..", "fixtures", "routes2"),
    });
    await expect(
      handleRequest(
        createMockContext({
          url: "/middleware",
        }),
        routes
      )
    ).resolves.toEqual({ value: { foo: "bar" } });
  });
  test("works with * for the method", async () => {
    const routes = await loadRoutes({
      routesDirectory: resolve(__dirname, "..", "fixtures", "routes2"),
    });
    await expect(
      handleRequest(
        createMockContext({
          url: "/auth/any",
          method: "GET",
        }),
        routes
      )
    ).resolves.toEqual({ value: { any: true } });
    await expect(
      handleRequest(
        createMockContext({
          url: "/auth/any",
          method: "POST",
        }),
        routes
      )
    ).resolves.toEqual({ value: { any: true } });
  });
});
