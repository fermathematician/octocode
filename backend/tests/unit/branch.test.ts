import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  branchNameFromTitle,
  slugifyTitle,
  titleFromBranch,
  uniqueBranchName,
} from "../../src/shared/branch.js";

describe("branch naming", () => {
  it("slugifies a title", () => {
    assert.equal(slugifyTitle("Add Login Flow!"), "add-login-flow");
  });

  it("builds a feat branch", () => {
    assert.equal(branchNameFromTitle("Add Login Flow"), "feat/add-login-flow");
  });

  it("falls back to story for an empty title", () => {
    assert.equal(branchNameFromTitle("!!!"), "feat/story");
  });

  it("returns the base when free", () => {
    assert.equal(uniqueBranchName("feat/x", []), "feat/x");
  });

  it("appends an increment on collision", () => {
    assert.equal(uniqueBranchName("feat/x", ["feat/x"]), "feat/x-2");
    assert.equal(
      uniqueBranchName("feat/x", ["feat/x", "feat/x-2"]),
      "feat/x-3",
    );
  });

  it("turns a branch into a title", () => {
    assert.equal(titleFromBranch("feat/add-login-flow"), "Add login flow");
    assert.equal(titleFromBranch("fix_typo"), "Fix typo");
    assert.equal(titleFromBranch("main"), "Main");
  });

  it("keeps a branch name when there is nothing to humanize", () => {
    assert.equal(titleFromBranch("feat/"), "feat/");
  });
});
