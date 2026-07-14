import "server-only";

import { prisma } from "@/lib/prisma";
import { AddClient } from "@backend/application/client/use-cases/add-client";
import { EditClient } from "@backend/application/client/use-cases/edit-client";
import { DeleteClient } from "@backend/application/client/use-cases/delete-client";
import { ListClients } from "@backend/application/client/use-cases/list-clients";
import { PrismaClientRepository } from "./client/prisma-client-repository";
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
