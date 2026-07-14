import { isClientStatus, type ClientStatus } from "./client-status";
import {
  CLIENT_NAME_MAX_LENGTH,
  isValidEmail,
  normalizeWebsiteUrl,
} from "./client-rules";
import {
  InvalidClientEmailError,
  InvalidClientNameError,
  InvalidClientStatusError,
  InvalidClientWebsiteError,
} from "./client.errors";

export interface ClientProps {
  id: string;
  name: string;
  website: string | null;
  contactName: string | null;
  contactEmail: string | null;
  status: ClientStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientProps {
  id: string;
  name: string;
  website?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  status?: ClientStatus;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateClientProps {
  name?: string;
  website?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  status?: ClientStatus;
  notes?: string | null;
}

/**
 * A client workspace managed within the SEO OS. Encapsulates the invariants
 * that must always hold for a client regardless of how it is stored or
 * presented.
 */
export class Client {
  private constructor(private props: ClientProps) {}

  /** Create a new, validated client from raw input. */
  static create(input: CreateClientProps): Client {
    const now = input.createdAt ?? new Date();

    return new Client({
      id: input.id,
      name: normalizeName(input.name),
      website: normalizeWebsite(input.website ?? null),
      contactName: normalizeOptionalText(input.contactName ?? null),
      contactEmail: normalizeEmail(input.contactEmail ?? null),
      status: normalizeStatus(input.status ?? "PROSPECT"),
      notes: normalizeOptionalText(input.notes ?? null),
      createdAt: now,
      updatedAt: input.updatedAt ?? now,
    });
  }

  /**
   * Rebuild an entity from already-persisted data. Trusts the stored values and
   * skips re-validation.
   */
  static reconstitute(props: ClientProps): Client {
    return new Client({ ...props });
  }

  /** Apply a partial update, enforcing invariants on any provided field. */
  update(changes: UpdateClientProps): void {
    if (changes.name !== undefined) {
      this.props.name = normalizeName(changes.name);
    }
    if (changes.website !== undefined) {
      this.props.website = normalizeWebsite(changes.website);
    }
    if (changes.contactName !== undefined) {
      this.props.contactName = normalizeOptionalText(changes.contactName);
    }
    if (changes.contactEmail !== undefined) {
      this.props.contactEmail = normalizeEmail(changes.contactEmail);
    }
    if (changes.status !== undefined) {
      this.props.status = normalizeStatus(changes.status);
    }
    if (changes.notes !== undefined) {
      this.props.notes = normalizeOptionalText(changes.notes);
    }
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get website(): string | null {
    return this.props.website;
  }

  get contactName(): string | null {
    return this.props.contactName;
  }

  get contactEmail(): string | null {
    return this.props.contactEmail;
  }

  get status(): ClientStatus {
    return this.props.status;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toObject(): ClientProps {
    return { ...this.props };
  }
}

function normalizeName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > CLIENT_NAME_MAX_LENGTH) {
    throw new InvalidClientNameError();
  }
  return trimmed;
}

function normalizeOptionalText(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeWebsite(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const normalized = normalizeWebsiteUrl(trimmed);
  if (normalized === null) {
    throw new InvalidClientWebsiteError(value);
  }
  return normalized;
}

function normalizeEmail(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0) {
    return null;
  }
  if (!isValidEmail(trimmed)) {
    throw new InvalidClientEmailError(value);
  }
  return trimmed;
}

function normalizeStatus(value: ClientStatus): ClientStatus {
  if (!isClientStatus(value)) {
    throw new InvalidClientStatusError(String(value));
  }
  return value;
}
