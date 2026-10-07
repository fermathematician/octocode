import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { StoryPriority } from "../../src/generated/prisma/client.js";
import { ValidationError } from "../../src/shared/validation.js";
import { parseCreateProjectBody, parseUpdateProjectBody, parseCreateProjectFromRepositoryBody } from "../../src/modules/projects/validation/project.schema.js";
import {
  parseCreateSprintBody,
  parseUpdateSprintBody,
} from "../../src/modules/sprints/validation/sprint.schema.js";
import {
  parseCreateStoryBody,
  parseMoveStorySprintBody,
  parseUpdateStoryBody,
} from "../../src/modules/stories/validation/story.schema.js";
import {
  parseCreateCalendarEventBody,
  parseUpdateCalendarEventBody,
} from "../../src/modules/calendar/validation/calendar.schema.js";
import { parseDevTokenBody } from "../../src/modules/auth/validation/dev-token.schema.js";

describe("story validation", () => {
  it("maps lowercase priority to the enum and trims the title", () => {
    const input = parseCreateStoryBody({
      projectId: "p1",
      title: "  Add login ",
      storyPoints: 5,
      priority: "high",
    });
    assert.equal(input.title, "Add login");
    assert.equal(input.storyPoints, 5);
    assert.equal(input.priority, StoryPriority.HIGH);
    assert.equal(input.branch, undefined);
  });

  it("rejects a non-Fibonacci point value", () => {
    assert.throws(
      () =>
        parseCreateStoryBody({
          projectId: "p1",
          title: "X",
          storyPoints: 4,
          priority: "low",
        }),
      ValidationError,
    );
  });

  it("rejects an unknown priority", () => {
    assert.throws(
      () =>
        parseCreateStoryBody({
          projectId: "p1",
          title: "X",
          storyPoints: 3,
          priority: "urgent",
        }),
      ValidationError,
    );
  });

  it("requires at least one update field", () => {
    assert.throws(() => parseUpdateStoryBody({}), ValidationError);
  });

  it("accepts a partial update", () => {
    assert.deepEqual(parseUpdateStoryBody({ storyPoints: 8 }), {
      storyPoints: 8,
    });
  });

  it("accepts null to clear the sprint and rejects a missing key", () => {
    assert.deepEqual(parseMoveStorySprintBody({ sprintId: null }), {
      sprintId: null,
    });
    assert.deepEqual(parseMoveStorySprintBody({ sprintId: "s1" }), {
      sprintId: "s1",
    });
    assert.throws(() => parseMoveStorySprintBody({}), ValidationError);
  });
});

describe("project validation", () => {
  it("defaults the color", () => {
    assert.equal(parseCreateProjectBody({ name: "P" }).color, "#4f46e5");
  });

  it("rejects an invalid color", () => {
    assert.throws(
      () => parseCreateProjectBody({ name: "P", color: "red" }),
      ValidationError,
    );
  });

  it("requires at least one update field", () => {
    assert.throws(() => parseUpdateProjectBody({}), ValidationError);
  });

  it("defaults the project name to the repository name", () => {
    const input = parseCreateProjectFromRepositoryBody({
      repoId: "1",
      owner: "octocode-labs",
      repositoryName: "my-repo",
      defaultBranch: "main",
      isPrivate: true,
    });

    assert.equal(input.name, "my-repo");
    assert.equal(input.color, "#4f46e5");
    assert.equal(input.isPrivate, true);
  });

  it("honors an explicit project name and rejects a bad color", () => {
    const input = parseCreateProjectFromRepositoryBody({
      name: "Custom",
      repoId: "1",
      owner: "o",
      repositoryName: "my-repo",
    });

    assert.equal(input.name, "Custom");
    assert.equal(input.defaultBranch, "main");
    assert.throws(
      () =>
        parseCreateProjectFromRepositoryBody({
          repoId: "1",
          owner: "o",
          repositoryName: "r",
          color: "red",
        }),
      ValidationError,
    );
  });
});

describe("sprint validation", () => {
  it("parses a valid date range", () => {
    const input = parseCreateSprintBody({
      name: "Sprint 1",
      startDate: "2030-01-01",
      endDate: "2030-01-10",
    });

    assert.equal(input.startDate, "2030-01-01");
    assert.equal(input.endDate, "2030-01-10");
  });

  it("rejects a malformed date", () => {
    assert.throws(
      () =>
        parseCreateSprintBody({
          name: "Sprint 1",
          startDate: "01/01/2030",
          endDate: "2030-01-10",
        }),
      ValidationError,
    );
  });

  it("rejects a missing end date", () => {
    assert.throws(
      () =>
        parseCreateSprintBody({
          name: "Sprint 1",
          startDate: "2030-01-01",
        }),
      ValidationError,
    );
  });

  it("requires at least one update field", () => {
    assert.throws(() => parseUpdateSprintBody({}), ValidationError);
  });
});

describe("calendar validation", () => {
  it("maps the type and validates the time", () => {
    const input = parseCreateCalendarEventBody({
      type: "reminder",
      title: "Pay rent",
      date: "2030-01-01",
      startTime: "09:00",
    });
    assert.equal(input.type, "REMINDER");
  });

  it("rejects an invalid time", () => {
    assert.throws(
      () =>
        parseCreateCalendarEventBody({
          type: "task",
          title: "X",
          date: "2030-01-01",
          startTime: "9am",
        }),
      ValidationError,
    );
  });

  it("accepts notes in an update", () => {
    assert.deepEqual(parseUpdateCalendarEventBody({ notes: "" }), {
      notes: "",
    });
  });

  it("accepts a completed flag in an update", () => {
    assert.deepEqual(parseUpdateCalendarEventBody({ completed: true }), {
      completed: true,
    });
  });

  it("rejects a non-boolean completed flag", () => {
    assert.throws(
      () => parseUpdateCalendarEventBody({ completed: "yes" }),
      ValidationError,
    );
  });

  it("requires at least one update field", () => {
    assert.throws(() => parseUpdateCalendarEventBody({}), ValidationError);
  });
});

describe("dev token validation", () => {
  it("trims and returns the token", () => {
    assert.deepEqual(parseDevTokenBody({ token: "  ghp_x  " }), {
      token: "ghp_x",
    });
  });

  it("rejects a missing token", () => {
    assert.throws(() => parseDevTokenBody({}), ValidationError);
  });
});
