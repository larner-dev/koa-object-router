import { ReadStream } from "fs";
import { HTTPRedirect } from "http-response-helpers";
import { Context } from "koa";
import { Jsonifiable } from "type-fest";
import { Key } from "path-to-regexp";

export interface RouterOptions {
  middleware?: MiddlewareHandler[];
  prefix?: string;
  priority?: number;
}

export interface RouterRoutes {
  [key: string]: RouteHandler | (RouteHandler | MiddlewareHandler)[];
}

export type MiddlewareHandler = (context: Context) => Promise<void>;
export type RouteHandlerResult = Jsonifiable | HTTPRedirect | ReadStream | void;
export type RouteHandler<
  C extends Context = Context,
  R extends RouteHandlerResult = RouteHandlerResult
> = (context: C) => Promise<R>;

export interface Router {
  options?: RouterOptions;
  routes: RouterRoutes;
}

export interface RouterConfig {
  routesDirectory?: string;
  passThrough?: boolean;
  routers?: Record<string, Router>;
  prefix?: string;
  excludeRegexString?: string;
  index?: string;
  errorHandler?: (error: unknown) => void;
}

export interface RouteMetadata {
  method: string;
  pattern: string;
  keys: Key[];
  regexp: RegExp;
  fns: (MiddlewareHandler | RouteHandler)[];
  middleware: MiddlewareHandler[];
  priority?: number;
}

export interface ErrorBody {
  code: string;
  params?: Jsonifiable;
}
