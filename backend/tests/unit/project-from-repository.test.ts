import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GithubRepositoryRepository } from "../../src/modules/github/repositories/GithubRepositoryRepository.js";
import { CreateProjectFromRepositoryService } from "../../src/modules/projects/services/CreateProjectFromRepositoryService.js";
import {
  InMemoryGithubRepositoryRepository,
  InMemoryProjectRepository,
  InMemoryStore,
} from "../support/fakes.js";

const input = {
  name: "Octocode",
  color: "#4f46e5",
  repoId: "123",
  owner: "octocode-labs",
  repositoryName: "octocode",
  defaultBranch: "main",
  isPrivate: false,
};

describe("CreateProjectFromRepositoryService", () => {
  it("creates a project linked to the repository", async () => {
    const store = new InMemoryStore();
    const projects = new InMemoryProjectRepository(store);
    const githubRepositories = new InMemoryGithubRepositoryRepository(store);
    const service = new CreateProjectFromRepositoryService(
      projects,
      githubRepositories,
    );
    const user = store.seedUser();

    const project = await service.execute(user.id, input);

    assert.equal(project.name, "Octocode");
    assert.equal(project.githubAccount, "octocode-labs");
    assert.equal(project.repository, "octocode");
    assert.equal(store.projects.length, 1);
    assert.equal(store.githubRepositories.length, 1);
  });

  it("removes the project when linking the repository fails", async () => {
    const store = new InMemoryStore();
    const projects = new InMemoryProjectRepository(store);
    const failing = {
      save: async () => {
        throw new Error("repository conflict");
      },
    } as unknown as GithubRepositoryRepository;
    const service = new CreateProjectFromRepositoryService(projects, failing);
    const user = store.seedUser();

    await assert.rejects(() => service.execute(user.id, input));
    assert.equal(store.projects.length, 0);
  });
});
