import { DomainError } from "../shared/domain-error";

export class InvalidTaskTitleError extends DomainError {
  constructor() {
    super("Task title is required and must be at most 200 characters.");
  }
}

export class InvalidTaskPriorityError extends DomainError {
  constructor(value: string) {
    super(`"${value}" is not a valid task priority.`);
  }
}

export class InvalidTaskStatusError extends DomainError {
  constructor(value: string) {
    super(`"${value}" is not a valid task status.`);
  }
}

export class InvalidTaskCompletionError extends DomainError {
  constructor(value: number) {
    super(`Completion must be a whole number between 0 and 100 (got ${value}).`);
  }
}

export class EmptyTaskNoteError extends DomainError {
  constructor() {
    super("A note cannot be empty.");
  }
}
