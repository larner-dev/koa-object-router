import Application, { Context } from "koa";
import { HTTPError, HTTPRedirect, isHTTPError } from "http-response-helpers";

import { ErrorBody, RouteMetadata, RouterConfig } from "./types";
import { handleRequest } from "./handleRequest";
import { loadRoutes } from "./loadRoutes";

export const router = (config: RouterConfig) => {
  if (!(config.routers || config.routesDirectory)) {
    throw new Error(
      "Router middleware config must specify either routers or routesDirectory"
    );
  }

  const routes: RouteMetadata[] = [];

  loadRoutes(config).then((r) => routes.push(...r));

  return async (ctx: Context, next: Application.Next): Promise<void> => {
    try {
      const result = await handleRequest(ctx, routes);
      if (result !== null) {
        if (result instanceof HTTPRedirect) {
          ctx.status = result.status;
          ctx.redirect(result.location);
        } else {
          ctx.body = result.value;
        }
      } else if (!config.passThrough) {
        throw new HTTPError.NotFound("NOT_FOUND");
      } else {
        await next();
      }
    } catch (error) {
      if (error && isHTTPError(error)) {
        ctx.response.status = error.status;
        const body: ErrorBody = { code: error.message };
        if (error.params) {
          body.params = error.params;
        }
        ctx.body = body;
        if (error.status >= 500 && config.errorHandler) {
          config.errorHandler(error);
        }
      } else {
        if (config.errorHandler) {
          config.errorHandler(error);
        }
        ctx.response.status = 500;
        ctx.body = { code: "INTERNAL_SERVER_ERROR" };
      }
    }
  };
};
