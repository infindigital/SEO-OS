import type { ClientReport } from "@backend/domain/client-report/client-report";

export interface ClientReportRepository {
  create(report: ClientReport): Promise<void>;
  listByClient(clientId: string): Promise<ClientReport[]>;
}
