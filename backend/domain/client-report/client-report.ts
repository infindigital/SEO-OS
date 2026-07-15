import { DomainError } from "../shared/domain-error";

export const REPORT_TITLE_MAX_LENGTH = 200;
export const REPORT_SUMMARY_MAX_LENGTH = 2000;

export class InvalidReportTitleError extends DomainError {
  constructor() {
    super(`Report title is required and must be at most ${REPORT_TITLE_MAX_LENGTH} characters.`);
  }
}

export interface ClientReportProps {
  id: string;
  clientId: string;
  title: string;
  period: string | null;
  summary: string | null;
  url: string | null;
  publishedAt: Date;
  createdAt: Date;
}

export interface CreateClientReportProps {
  id: string;
  clientId: string;
  title: string;
  period?: string | null;
  summary?: string | null;
  url?: string | null;
  publishedAt?: Date;
  createdAt?: Date;
}

/** A client-facing report/deliverable shown on the client portal. */
export class ClientReport {
  private constructor(private props: ClientReportProps) {}

  static create(input: CreateClientReportProps): ClientReport {
    const now = input.createdAt ?? new Date();
    return new ClientReport({
      id: input.id,
      clientId: input.clientId,
      title: normalizeTitle(input.title),
      period: normalizeOptional(input.period ?? null),
      summary: normalizeOptional(input.summary ?? null),
      url: normalizeOptional(input.url ?? null),
      publishedAt: input.publishedAt ?? now,
      createdAt: now,
    });
  }

  static reconstitute(props: ClientReportProps): ClientReport {
    return new ClientReport({ ...props });
  }

  get id(): string {
    return this.props.id;
  }
  get clientId(): string {
    return this.props.clientId;
  }
  get title(): string {
    return this.props.title;
  }
  get period(): string | null {
    return this.props.period;
  }
  get summary(): string | null {
    return this.props.summary;
  }
  get url(): string | null {
    return this.props.url;
  }
  get publishedAt(): Date {
    return this.props.publishedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}

function normalizeTitle(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > REPORT_TITLE_MAX_LENGTH) {
    throw new InvalidReportTitleError();
  }
  return trimmed;
}

function normalizeOptional(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
