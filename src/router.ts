import Application, { Context } from "koa";
import { isHTTPError } from "http-response-helpers";

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

  //   if(config.routers)

  loadRoutes(config, routes);

  return async (ctx: Context, next: Application.Next): Promise<void> => {
    try {
      const result = await handleRequest(ctx, routes);
      if (result !== null) {
        ctx.body = result.value;
      } else if (!config.passThrough) {
        await next();
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
