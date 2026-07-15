import { DomainError } from "@backend/domain/shared/domain-error";
import { ApplicationError } from "@backend/application/shared/application-error";
import type { PortalReport } from "@backend/application/client-portal/dto";
import type { PublishClientReport } from "@backend/application/client-portal/use-cases/publish-report";
import {
  ActionResult,
  failure,
  fromZodError,
  ok,
} from "@backend/interface/shared/action-result";
import { publishReportSchema } from "./client-portal.schemas";

export interface ClientPortalUseCases {
  publishReport: PublishClientReport;
}

const GENERIC_ERROR = "Something went wrong. Please try again.";

export class ClientPortalController {
  constructor(private readonly useCases: ClientPortalUseCases) {}

  async publishReport(input: unknown): Promise<ActionResult<PortalReport>> {
    const parsed = publishReportSchema.safeParse(input);
    if (!parsed.success) {
      return fromZodError(parsed.error);
    }
    const { clientId, title, period, summary, url } = parsed.data;
    return this.run(() =>
      this.useCases.publishReport.execute({
        clientId,
        title,
        period: period || null,
        summary: summary || null,
        url: url || null,
      }),
    );
  }

  private async run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
    try {
      return ok(await fn());
    } catch (error) {
      if (error instanceof DomainError || error instanceof ApplicationError) {
        return failure(error.message);
      }
      console.error("[ClientPortalController] unexpected error", error);
      return failure(GENERIC_ERROR);
    }
  }
}
