import { requireAuth } from "../http/middleware/ensureAuthenticated.js";
import { CreateCalendarEventController } from "../modules/calendar/controllers/CreateCalendarEventController.js";
import { DeleteCalendarEventController } from "../modules/calendar/controllers/DeleteCalendarEventController.js";
import { ListCalendarEventsController } from "../modules/calendar/controllers/ListCalendarEventsController.js";
import { createCalendarRouter } from "../modules/calendar/routes/calendar.routes.js";
import { CreateCalendarEventService } from "../modules/calendar/services/CreateCalendarEventService.js";
import { DeleteCalendarEventService } from "../modules/calendar/services/DeleteCalendarEventService.js";
import { ListCalendarEventsService } from "../modules/calendar/services/ListCalendarEventsService.js";
import * as shared from "./shared.js";

const list = new ListCalendarEventsController(
  new ListCalendarEventsService(shared.calendarEventRepository),
);

const create = new CreateCalendarEventController(
  new CreateCalendarEventService(shared.calendarEventRepository),
);

const remove = new DeleteCalendarEventController(
  new DeleteCalendarEventService(shared.calendarEventRepository),
);

export const calendarRouter = createCalendarRouter(
  { list, create, remove },
  requireAuth,
);
