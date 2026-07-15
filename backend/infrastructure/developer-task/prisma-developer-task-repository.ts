import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  DeveloperTask,
  TaskNote,
  TaskScreenshot,
} from "@backend/domain/developer-task/developer-task";
import type { DeveloperTaskRepository } from "@backend/application/developer-task/ports/developer-task-repository";
import type { ListTasksQuery } from "@backend/application/developer-task/dto";
import { toDomain } from "./developer-task.mapper";

const INCLUDE_CHILDREN = {
  notes: { orderBy: { createdAt: "asc" } },
  screenshots: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.DeveloperTaskInclude;

/** Prisma-backed implementation of the {@link DeveloperTaskRepository} port. */
export class PrismaDeveloperTaskRepository implements DeveloperTaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(task: DeveloperTask): Promise<void> {
    await this.prisma.developerTask.create({ data: this.toData(task) });
  }

  async update(task: DeveloperTask): Promise<void> {
    await this.prisma.developerTask.update({
      where: { id: task.id },
      data: {
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        completion: task.completion,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        clientId: task.clientId,
        completedAt: task.completedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.developerTask.delete({ where: { id } });
  }

  async findById(id: string): Promise<DeveloperTask | null> {
    const record = await this.prisma.developerTask.findUnique({
      where: { id },
      include: INCLUDE_CHILDREN,
    });
    return record ? toDomain(record) : null;
  }

  async list(query: ListTasksQuery): Promise<DeveloperTask[]> {
    const where: Prisma.DeveloperTaskWhereInput = {};

    if (query.status) {
      where.status = query.status;
    } else if (query.openOnly) {
      where.status = { not: "DONE" };
    }
    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }
    if (query.clientId) {
      where.clientId = query.clientId;
    }

    const records = await this.prisma.developerTask.findMany({
      where,
      include: INCLUDE_CHILDREN,
      orderBy: { createdAt: "desc" },
    });
    return records.map(toDomain);
  }

  async saveNote(taskId: string, note: TaskNote): Promise<void> {
    await this.prisma.developerTaskNote.create({
      data: {
        id: note.id,
        taskId,
        authorId: note.authorId,
        body: note.body,
        createdAt: note.createdAt,
      },
    });
  }

  async saveScreenshot(taskId: string, screenshot: TaskScreenshot): Promise<void> {
    await this.prisma.developerTaskScreenshot.create({
      data: {
        id: screenshot.id,
        taskId,
        uploaderId: screenshot.uploaderId,
        path: screenshot.path,
        url: screenshot.url,
        caption: screenshot.caption,
        createdAt: screenshot.createdAt,
      },
    });
  }

  private toData(task: DeveloperTask): Prisma.DeveloperTaskUncheckedCreateInput {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      completion: task.completion,
      dueDate: task.dueDate,
      assigneeId: task.assigneeId,
      clientId: task.clientId,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
