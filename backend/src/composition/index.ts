import { Router } from "express";
import { authRouter, ensureAuthenticated } from "./auth.js";
import { calendarRouter } from "./calendar.js";
import { githubRouter } from "./github.js";
import { googleCalendarRouter, syncAllCalendars } from "./google-calendar.js";
import { projectsRouter } from "./projects.js";
import { sprintsRouter } from "./sprints.js";
import { storiesRouter } from "./stories.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/projects", projectsRouter);
apiRouter.use("/sprints", sprintsRouter);
apiRouter.use("/stories", storiesRouter);
apiRouter.use("/calendar-events", calendarRouter);
apiRouter.use("/github", githubRouter);
apiRouter.use("/calendar", googleCalendarRouter);

export { ensureAuthenticated, syncAllCalendars };
