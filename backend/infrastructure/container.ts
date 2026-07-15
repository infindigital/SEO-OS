import "server-only";

import { prisma } from "@/lib/prisma";
import { AddClient } from "@backend/application/client/use-cases/add-client";
import { EditClient } from "@backend/application/client/use-cases/edit-client";
import { DeleteClient } from "@backend/application/client/use-cases/delete-client";
import { ListClients } from "@backend/application/client/use-cases/list-clients";
import { ListProfiles } from "@backend/application/auth/use-cases/list-profiles";
import { UpdateUserRole } from "@backend/application/auth/use-cases/update-user-role";
import { GetDashboardOverview } from "@backend/application/metrics/use-cases/get-dashboard-overview";
import { SyncSearchConsole } from "@backend/application/search-console/use-cases/sync-search-console";
import { SyncAllSearchConsole } from "@backend/application/search-console/use-cases/sync-all-search-console";
import { PrismaClientRepository } from "./client/prisma-client-repository";
import { PrismaProfileRepository } from "./auth/prisma-profile-repository";
import { PrismaMetricsRepository } from "./metrics/prisma-metrics-repository";
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
  list: new ListClients(clientRepository),
} as const;

export type ClientUseCases = typeof clientUseCases;

const profileRepository = new PrismaProfileRepository(prisma);

export const profileUseCases = {
  list: new ListProfiles(profileRepository),
  updateRole: new UpdateUserRole(profileRepository),
} as const;

export type ProfileUseCases = typeof profileUseCases;

const metricsRepository = new PrismaMetricsRepository(prisma);

export const dashboardUseCases = {
  overview: new GetDashboardOverview(metricsRepository),
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
