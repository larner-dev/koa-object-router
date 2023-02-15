import { readdir } from "fs/promises";
import { extname, join, resolve } from "path";
import { Key, pathToRegexp } from "path-to-regexp";
import {
  MiddlewareHandler,
  RouteHandler,
  RouteMetadata,
  RouterConfig,
  RouterOptions,
  RouterRoutes,
} from "./types";

export const loadRoutes = async (
  config: RouterConfig
): Promise<RouteMetadata[]> => {
  const allRoutes: RouteMetadata[] = [];
  const indexRoute = config.index || "index";
  const routers: {
    routes: RouterRoutes;
    options: RouterOptions;
    name: string;
  }[] = [];
  if (config.routers) {
    for (const name of Object.keys(config.routers)) {
      routers.push({
        name,
        options: config.routers[name].options || {},
        routes: config.routers[name].routes,
      });
    }
  }

  if (config.routesDirectory) {
    let routerPaths: string[] = [];
    try {
      routerPaths = await readdir(config.routesDirectory);
    } catch (error) {
      if ((error as Record<string, unknown>).code === "ENOENT") {
        throw new Error(
          `The routes directory does not exist: "${config.routesDirectory}"`
        );
      }
      throw error;
    }
    routerPaths = routerPaths.filter((path) => path.match("^.+.m?[jt]s"));
    if (config.excludeRegexString) {
      const excludeRegex = new RegExp(config.excludeRegexString);
      routerPaths = routerPaths.filter((path) => !path.match(excludeRegex));
    }

    for (const routePath of routerPaths) {
      const name = routePath.substring(
        0,
        routePath.length - extname(routePath).length
      );
      try {
        const router = await import(resolve(config.routesDirectory, routePath));
        // If the route uses export we need to pull default property from it
        if (router.routes) {
          routers.push({
            routes: router.routes,
            options: router.options || {},
            name,
          });
        }
      } catch (error) {
        console.warn(error);
      }
    }
  }

  for (const { name, routes, options } of routers) {
    const middleware = options.middleware || [];
    const endpointsPrefix = options.prefix || "";
    const priority = options.priority;
    const keys = Object.keys(routes);
    for (const key of keys) {
      const keyPieces = key.split(" ");
      if (keyPieces.length < 2) {
        throw new Error(`Invalid endpoint format for "${key}"`);
      }
      const method = keyPieces[0];
      const subPattern = keyPieces.slice(1).join(" ");
      let prefix = join(endpointsPrefix, name);
      let suffix = subPattern;
      if (prefix === indexRoute) {
        prefix = "";
      }
      if (suffix.startsWith("/")) {
        suffix = suffix.substring(1);
      }
      const pieces = [prefix, suffix];
      if (config.prefix) {
        if (config.prefix.startsWith("/")) {
          config.prefix = config.prefix.substring(1);
        }
        pieces.unshift(config.prefix);
      }
      const pattern = "/" + pieces.filter((v) => v).join("/");
      const keys: Key[] = [];
      const regexp = pathToRegexp(pattern, keys);
      const fns = (
        Array.isArray(routes[key]) ? routes[key] : [routes[key]]
      ) as (MiddlewareHandler | RouteHandler)[];
      allRoutes.push({
        method,
        pattern,
        regexp,
        keys,
        fns,
        middleware,
        priority,
      });
    }
    allRoutes.sort((a, b) => {
      if (a.priority === b.priority) {
        return 0;
      }
      if (a.priority === undefined) {
        return 1;
      }
      if (b.priority === undefined) {
        return -1;
      }
      return a.priority < b.priority ? -1 : 1;
    });
  }
  return allRoutes;
};
