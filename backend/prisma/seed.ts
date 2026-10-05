import "dotenv/config";
import {
  StoryPriority,
  StoryStatus,
} from "../src/generated/prisma/client.js";
import { prisma } from "../src/infrastructure/prisma/client.js";

const login = process.env.SEED_USER_LOGIN ?? "demo";

function isoDate(offsetDays: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date;
}

async function main(): Promise<void> {
  const user = await prisma.user.upsert({
    where: { login },
    create: { login, name: "Demo User" },
    update: {},
  });

  const existing = await prisma.project.findFirst({
    where: { ownerId: user.id, name: "Octocode" },
  });

  if (existing) {
    console.log(
      `Seed skipped: user "${login}" already owns a project. Delete it first to reseed.`,
    );
    return;
  }

  const project = await prisma.project.create({
    data: { ownerId: user.id, name: "Octocode", color: "#4f46e5" },
  });

  await prisma.githubRepository.create({
    data: {
      projectId: project.id,
      userId: user.id,
      repoId: `seed-${project.id}`,
      owner: "octocode-labs",
      name: "octocode",
      defaultBranch: "main",
    },
  });

  const sprint = await prisma.sprint.create({
    data: {
      ownerId: user.id,
      name: "Sprint 1",
      startDate: isoDate(-2),
      endDate: isoDate(4),
    },
  });

  const stories = [
    {
      title: "Define project domain model",
      storyPoints: 8,
      priority: StoryPriority.CRITICAL,
      status: StoryStatus.REFACTOR,
      branch: "feat/domain-model",
      completedAt: isoDate(-1),
    },
    {
      title: "Project sidebar navigation",
      storyPoints: 5,
      priority: StoryPriority.HIGH,
      status: StoryStatus.CODE,
      branch: "feat/sidebar-navigation",
      completedAt: null,
    },
    {
      title: "Backlog story cards",
      storyPoints: 3,
      priority: StoryPriority.MEDIUM,
      status: StoryStatus.BACKLOG,
      branch: "feat/backlog-cards",
      completedAt: null,
    },
  ];

  for (const story of stories) {
    await prisma.story.create({
      data: {
        projectId: project.id,
        sprintId: sprint.id,
        title: story.title,
        storyPoints: story.storyPoints,
        priority: story.priority,
        status: story.status,
        branch: story.branch,
        completedAt: story.completedAt,
      },
    });
  }

  await prisma.calendarEvent.createMany({
    data: [
      {
        userId: user.id,
        type: "MEETING",
        title: "Daily standup",
        date: isoDate(0),
        startTime: "09:30",
        notes: "Sync on the sprint.",
      },
      {
        userId: user.id,
        type: "REMINDER",
        title: "Renew domain registration",
        date: isoDate(3),
        startTime: "08:00",
      },
    ],
  });

  console.log(
    `Seeded project "Octocode" for user "${login}". Sign in with GitHub as "${login}" to see it.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
