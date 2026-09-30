import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPage,
  parsePagination,
  MAX_LIMIT,
} from "../../src/shared/pagination.js";
import { ValidationError } from "../../src/shared/validation.js";

describe("parsePagination", () => {
  it("defaults the limit and has no cursor", () => {
    assert.deepEqual(parsePagination({}), { limit: 100 });
  });

  it("parses limit and cursor", () => {
    assert.deepEqual(parsePagination({ limit: "10", cursor: "abc" }), {
      limit: 10,
      cursor: "abc",
    });
  });

  it("caps the limit at the maximum", () => {
    assert.equal(parsePagination({ limit: "100000" }).limit, MAX_LIMIT);
  });

  it("rejects a non-numeric limit", () => {
    assert.throws(
      () => parsePagination({ limit: "abc" }),
      ValidationError,
    );
  });

  it("rejects a zero limit", () => {
    assert.throws(() => parsePagination({ limit: "0" }), ValidationError);
  });

  it("rejects an empty cursor", () => {
    assert.throws(() => parsePagination({ cursor: "  " }), ValidationError);
  });
});

describe("buildPage", () => {
  const rows = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("returns all rows when under the limit", () => {
    assert.deepEqual(buildPage(rows, 5), { items: rows, nextCursor: null });
  });

  it("returns a cursor when there are more rows", () => {
    const page = buildPage(rows, 2);
    assert.deepEqual(page.items, [{ id: "a" }, { id: "b" }]);
    assert.equal(page.nextCursor, "b");
  });
});
