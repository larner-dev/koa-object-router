import { HTTPError } from "http-response-helpers";
import { Context } from "koa";

interface ParamContext extends Context {
  params: { id: string };
}

export const options = {
  middleware: [
    async (ctx: ParamContext) => {
      ctx.foo = "bar";
    },
  ],
};

export const routes = {
  "GET /": [
    async (ctx: ParamContext) => {
      return { foo: ctx.foo };
    },
  ],
};
