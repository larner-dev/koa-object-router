import { handleRequest } from "./handleRequest";
import { describe, test, expect } from "vitest";
import { createMockContext } from "./createMockContext";

describe("handleRequest", () => {
  test("null when no route matches", () => {
    expect(handleRequest(createMockContext(), [])).resolves.toEqual(null);
  });
});
