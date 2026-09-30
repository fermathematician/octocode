import { Router, type RequestHandler } from "express";
import { validate } from "../../../http/middleware/validate.js";
import type { CreateCalendarEventController } from "../controllers/CreateCalendarEventController.js";
import type { DeleteCalendarEventController } from "../controllers/DeleteCalendarEventController.js";
import type { ListCalendarEventsController } from "../controllers/ListCalendarEventsController.js";
import type { UpdateCalendarEventController } from "../controllers/UpdateCalendarEventController.js";
import {
  parseCalendarEventParams,
  parseCreateCalendarEventBody,
  parseListCalendarEventsQuery,
  parseUpdateCalendarEventBody,
} from "../validation/calendar.schema.js";

export interface CalendarControllers {
  list: ListCalendarEventsController;
  create: CreateCalendarEventController;
  update: UpdateCalendarEventController;
  remove: DeleteCalendarEventController;
}

export function createCalendarRouter(
  controllers: CalendarControllers,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.use(requireAuth);
  router.get(
    "/",
    validate({ query: parseListCalendarEventsQuery }),
    controllers.list.handle,
  );
  router.post(
    "/",
    validate({ body: parseCreateCalendarEventBody }),
    controllers.create.handle,
  );
  router.patch(
    "/:eventId",
    validate({
      params: parseCalendarEventParams,
      body: parseUpdateCalendarEventBody,
    }),
    controllers.update.handle,
  );
  router.delete(
    "/:eventId",
    validate({ params: parseCalendarEventParams }),
    controllers.remove.handle,
  );

  return router;
}
