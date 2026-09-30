import { env } from "../config/env.js";
import { requireAuth } from "../http/middleware/ensureAuthenticated.js";
import { DisconnectGoogleController } from "../modules/google-calendar/controllers/DisconnectGoogleController.js";
import { GetCalendarSyncStatusController } from "../modules/google-calendar/controllers/GetCalendarSyncStatusController.js";
import { HandleGoogleCallbackController } from "../modules/google-calendar/controllers/HandleGoogleCallbackController.js";
import { StartGoogleLinkController } from "../modules/google-calendar/controllers/StartGoogleLinkController.js";
import { SyncCalendarController } from "../modules/google-calendar/controllers/SyncCalendarController.js";
import { createGoogleCalendarRouter } from "../modules/google-calendar/routes/google-calendar.routes.js";
import { DisconnectGoogleService } from "../modules/google-calendar/services/DisconnectGoogleService.js";
import { GetCalendarSyncStatusService } from "../modules/google-calendar/services/GetCalendarSyncStatusService.js";
import { HandleGoogleCallbackService } from "../modules/google-calendar/services/HandleGoogleCallbackService.js";
import { StartGoogleLinkService } from "../modules/google-calendar/services/StartGoogleLinkService.js";
import { SyncAllCalendarsService } from "../modules/google-calendar/services/SyncAllCalendarsService.js";
import { SyncCalendarService } from "../modules/google-calendar/services/SyncCalendarService.js";
import * as shared from "./shared.js";

const syncCalendar = new SyncCalendarService(
  shared.calendarEventRepository,
  shared.calendarSyncStateRepository,
  shared.googleTokenProvider,
  shared.googleCalendarClient,
  env.google.timeZone,
);

const startLink = new StartGoogleLinkController(
  new StartGoogleLinkService(shared.googleCalendarClient),
);

const callback = new HandleGoogleCallbackController(
  new HandleGoogleCallbackService(
    shared.googleCalendarClient,
    shared.tokenCipher,
    shared.oauthAccountRepository,
  ),
);

const status = new GetCalendarSyncStatusController(
  new GetCalendarSyncStatusService(
    shared.oauthAccountRepository,
    shared.calendarSyncStateRepository,
  ),
);

const disconnect = new DisconnectGoogleController(
  new DisconnectGoogleService(
    shared.oauthAccountRepository,
    shared.calendarSyncStateRepository,
    shared.calendarEventRepository,
  ),
);

const sync = new SyncCalendarController(syncCalendar);

export const googleCalendarRouter = createGoogleCalendarRouter(
  { startLink, callback, status, disconnect, sync },
  requireAuth,
);

export const syncAllCalendars = new SyncAllCalendarsService(
  shared.calendarSyncStateRepository,
  syncCalendar,
);
