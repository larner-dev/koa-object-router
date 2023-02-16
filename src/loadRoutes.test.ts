import { loadRoutes } from "./loadRoutes";
import { describe, test, expect, vi } from "vitest";
import { RouteHandler } from "./types";
import { resolve } from "path";

describe("handleRequest", () => {
  test("return empty array when there are no routers or routesDirectory", () => {
    expect(loadRoutes({})).resolves.toEqual([]);
  });
  test("returns routers from config.routers and config.routesDirectory", async () => {
    const fooHandler = (async (): Promise<string> => "foo") as RouteHandler;
    const promise = loadRoutes({
      routesDirectory: resolve(__dirname, "../fixtures/routes1"),
      routers: {
        index: {
          routes: { "GET /": fooHandler },
        },
      },
    });

    await expect(promise).resolves.toEqual([
      expect.objectContaining({
        fns: [fooHandler],
        keys: [],
        method: "GET",
        middleware: [],
        pattern: "/",
      }),
      expect.objectContaining({
        keys: [],
        method: "GET",
        middleware: [],
        pattern: "/auth/bar",
      }),
    ]);
    expect((await promise)[1].fns.length).toEqual(1);
  });
  test("throws an error if the routes directory doesn't exist", async () => {
    const routesDirectory = resolve(__dirname, "../fixtures/routesxyz");
    const promise = loadRoutes({
      routesDirectory,
    });
    await expect(promise).rejects.toThrow(
      `The routes directory does not exist: "${routesDirectory}"`
    );
  });
  test("returns an empty array when all routers are excluded", async () => {
    const promise = loadRoutes({
      routesDirectory: resolve(__dirname, "../fixtures/routes1"),
      excludeRegexString: ".*",
    });

    await expect(promise).resolves.toEqual([]);
  });
  test("skips routers that are malformed", async () => {
    const consoleWarn = vi
      .spyOn(console, "warn")
      .mockImplementation(() => null);
    const promise = loadRoutes({
      routesDirectory: resolve(__dirname, "../fixtures/routes_malformed"),
    });

    await expect(promise).resolves.toEqual([]);
    expect(consoleWarn).toHaveBeenCalledOnce();
  });
  test("throws an error if the key is bad", async () => {
    const fooHandler = (async (): Promise<string> => "foo") as RouteHandler;

    const promise = loadRoutes({
      routers: {
        foo: {
          routes: { "GET/": fooHandler },
        },
      },
    });

    await expect(promise).rejects.toThrow('Invalid endpoint format for "GET/"');
  });
  test("returns correct routers with prefix", async () => {
    const fooHandler = (async (): Promise<string> => "foo") as RouteHandler;
    const promise = loadRoutes({
      routesDirectory: resolve(__dirname, "../fixtures/routes1"),
      routers: {
        index: {
          routes: { "GET /": fooHandler },
        },
      },
      prefix: "/aaa",
    });

    await expect(promise).resolves.toEqual([
      expect.objectContaining({
        fns: [fooHandler],
        keys: [],
        method: "GET",
        middleware: [],
        pattern: "/aaa",
      }),
      expect.objectContaining({
        keys: [],
        method: "GET",
        middleware: [],
        pattern: "/aaa/auth/bar",
      }),
    ]);
    expect((await promise)[1].fns.length).toEqual(1);
  });
  test("respects route priorities", async () => {
    const fooHandler = (async (): Promise<string> => "foo") as RouteHandler;

    const promise = loadRoutes({
      routers: {
        index: {
          routes: { "GET /:slug": fooHandler },
        },
        foo: {
          options: { priority: 1 },
          routes: { "GET /": fooHandler },
        },
        bar: {
          options: { priority: 2 },
          routes: { "GET /": fooHandler },
        },
      },
    });

    await expect(promise).resolves.toEqual([
      expect.objectContaining({
        keys: [],
        method: "GET",
        middleware: [],
        pattern: "/foo",
      }),
      expect.objectContaining({
        keys: [],
        method: "GET",
        middleware: [],
        pattern: "/bar",
      }),
      expect.objectContaining({
        keys: [
          {
            modifier: "",
            name: "slug",
            pattern: "[^\\/#\\?]+?",
            prefix: "/",
            suffix: "",
          },
        ],
        method: "GET",
        middleware: [],
        pattern: "/:slug",
      }),
    ]);
  });
  test.only("works with cjs", async () => {
    const routesDirectory = resolve(__dirname, "../fixtures/routes_cjs");
    const promise = loadRoutes({
      routesDirectory,
    });
    await expect(promise).resolves.toEqual([
      expect.objectContaining({
        keys: [],
        method: "GET",
        middleware: [],
        pattern: "/",
      }),
    ]);
  });
});
