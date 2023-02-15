import { Context } from "koa";
import { RouteHandlerResult, RouteMetadata } from "./types";

export const handleRequest = async (
  ctx: Context,
  routes: RouteMetadata[]
): Promise<{ value: RouteHandlerResult } | null> => {
  const method = ctx.method;
  let matchedRoute: RouteMetadata | null = null;
  let match: RegExpExecArray | null = null;

  for (const route of routes) {
    if (route.method === "*" || route.method === method.toUpperCase()) {
      match = route.regexp.exec(ctx.path || "");
      if (match) {
        matchedRoute = route;
        break;
      }
    }
  }
  if (match && matchedRoute) {
    const params: Record<string, string> = {};
    for (let i = 0; i < matchedRoute.keys.length; i++) {
      params[matchedRoute.keys[i].name] = match[i + 1];
    }

    let result: RouteHandlerResult = null;

    for (const fn of matchedRoute.middleware) {
      result = await fn(ctx);
    }
    for (const fn of matchedRoute.fns) {
      result = await fn(ctx);
    }
    return { value: result };
  }
  return null;
};
