import { HTTPError } from "http-response-helpers";
import { Context } from "koa";

interface ParamContext extends Context {
  params: { id: string };
}

export const options = {};

export const routes = {
  "GET /throw": async () => {
    throw new HTTPError.BadRequest("BAD");
  },
  "GET /param/:id": async (ctx: ParamContext) => {
    return { id: ctx.params.id };
  },
  "* /any": async (ctx: ParamContext) => {
    return { any: true };
  },
  "GET /middleware": [
    async (ctx: ParamContext) => {
      ctx.foo = "bar";
    },
    async (ctx: ParamContext) => {
      return { foo: ctx.foo };
    },
  ],
};
