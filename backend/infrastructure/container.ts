import "server-only";

import { prisma } from "@/lib/prisma";
import { AddClient } from "@backend/application/client/use-cases/add-client";
import { EditClient } from "@backend/application/client/use-cases/edit-client";
import { DeleteClient } from "@backend/application/client/use-cases/delete-client";
import { ArchiveClient } from "@backend/application/client/use-cases/archive-client";
import { GetClient } from "@backend/application/client/use-cases/get-client";
import { ListClients } from "@backend/application/client/use-cases/list-clients";
import { GetClientPortfolioSummary } from "@backend/application/client/use-cases/get-client-portfolio-summary";
import { ListProfiles } from "@backend/application/auth/use-cases/list-profiles";
import { UpdateUserRole } from "@backend/application/auth/use-cases/update-user-role";
import { GetDashboardOverview } from "@backend/application/metrics/use-cases/get-dashboard-overview";
import { GetAgencyOverview } from "@backend/application/dashboards/use-cases/get-agency-overview";
import { GetClientDashboard } from "@backend/application/dashboards/use-cases/get-client-dashboard";
import { GetInternalDashboard } from "@backend/application/dashboards/use-cases/get-internal-dashboard";
import { SyncSearchConsole } from "@backend/application/search-console/use-cases/sync-search-console";
import { SyncAllSearchConsole } from "@backend/application/search-console/use-cases/sync-all-search-console";
import { CreateDeveloperTask } from "@backend/application/developer-task/use-cases/create-task";
import { UpdateDeveloperTask } from "@backend/application/developer-task/use-cases/update-task";
import { ListDeveloperTasks } from "@backend/application/developer-task/use-cases/list-tasks";
import { MarkTaskComplete } from "@backend/application/developer-task/use-cases/mark-task-complete";
import { AddTaskNote } from "@backend/application/developer-task/use-cases/add-task-note";
import { UploadTaskScreenshot } from "@backend/application/developer-task/use-cases/upload-task-screenshot";
import { GetDeveloperBoardSummary } from "@backend/application/developer-task/use-cases/get-board-summary";
import { PrismaDeveloperTaskRepository } from "./developer-task/prisma-developer-task-repository";
import { SupabaseScreenshotStorage } from "./developer-task/supabase-screenshot-storage";
import { PrismaClientRepository } from "./client/prisma-client-repository";
import { PrismaProfileRepository } from "./auth/prisma-profile-repository";
import { PrismaMetricsRepository } from "./metrics/prisma-metrics-repository";
import { PrismaSearchConsoleReadRepository } from "./dashboards/prisma-search-console-read-repository";
import { PrismaSearchConsoleRepository } from "./search-console/prisma-search-console-repository";
import { GoogleOAuthService } from "./search-console/google-oauth";
import { GoogleSearchConsoleGatewayFactory } from "./search-console/google-search-console-gateway-factory";
import { CryptoIdGenerator } from "./id/crypto-id-generator";

/**
 * Composition root. Wires concrete infrastructure adapters to application use
 * cases. This module is server-only — it must never be imported into client
 * components.
 */
const clientRepository = new PrismaClientRepository(prisma);
const idGenerator = new CryptoIdGenerator();

export const clientUseCases = {
  add: new AddClient(clientRepository, idGenerator),
  edit: new EditClient(clientRepository),
  delete: new DeleteClient(clientRepository),
  archive: new ArchiveClient(clientRepository),
  get: new GetClient(clientRepository),
  list: new ListClients(clientRepository),
  portfolioSummary: new GetClientPortfolioSummary(clientRepository),
} as const;

export type ClientUseCases = typeof clientUseCases;

const profileRepository = new PrismaProfileRepository(prisma);

export const profileUseCases = {
  list: new ListProfiles(profileRepository),
  updateRole: new UpdateUserRole(profileRepository),
} as const;

export type ProfileUseCases = typeof profileUseCases;

const developerTaskRepository = new PrismaDeveloperTaskRepository(prisma);
const screenshotStorage = new SupabaseScreenshotStorage();

export const developerTaskUseCases = {
  create: new CreateDeveloperTask(developerTaskRepository, idGenerator),
  update: new UpdateDeveloperTask(developerTaskRepository),
  list: new ListDeveloperTasks(developerTaskRepository),
  markComplete: new MarkTaskComplete(developerTaskRepository),
  addNote: new AddTaskNote(developerTaskRepository, idGenerator),
  uploadScreenshot: new UploadTaskScreenshot(
    developerTaskRepository,
    screenshotStorage,
    idGenerator,
  ),
  boardSummary: new GetDeveloperBoardSummary(developerTaskRepository),
} as const;

export type DeveloperTaskUseCasesContainer = typeof developerTaskUseCases;

const metricsRepository = new PrismaMetricsRepository(prisma);
const searchConsoleReadRepository = new PrismaSearchConsoleReadRepository(prisma);

export const dashboardUseCases = {
  overview: new GetDashboardOverview(metricsRepository),
  agency: new GetAgencyOverview(clientRepository, searchConsoleReadRepository),
  client: new GetClientDashboard(clientRepository, searchConsoleReadRepository),
  internal: new GetInternalDashboard(
    metricsRepository,
    clientRepository,
    profileRepository,
  ),
} as const;

export type DashboardUseCases = typeof dashboardUseCases;

const searchConsoleRepository = new PrismaSearchConsoleRepository(prisma);
const googleOAuthService = new GoogleOAuthService({
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
  redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "",
});
const searchConsoleGatewayFactory = new GoogleSearchConsoleGatewayFactory(
  googleOAuthService,
);
const syncSearchConsole = new SyncSearchConsole(
  searchConsoleRepository,
  searchConsoleGatewayFactory,
);

export const searchConsole = {
  oauth: googleOAuthService,
  repository: searchConsoleRepository,
  syncOne: syncSearchConsole,
  syncAll: new SyncAllSearchConsole(searchConsoleRepository, syncSearchConsole),
} as const;

export type SearchConsoleModule = typeof searchConsole;
