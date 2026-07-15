-- CreateEnum
CREATE TYPE "DevTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DevTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE');

-- CreateTable
CREATE TABLE "developer_tasks" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "DevTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "DevTaskStatus" NOT NULL DEFAULT 'OPEN',
    "completion" INTEGER NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3),
    "assignee_id" UUID,
    "client_id" UUID,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "developer_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "developer_task_notes" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "author_id" UUID,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "developer_task_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "developer_task_screenshots" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "uploader_id" UUID,
    "path" TEXT NOT NULL,
    "url" TEXT,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "developer_task_screenshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "developer_tasks_assignee_id_idx" ON "developer_tasks"("assignee_id");

-- CreateIndex
CREATE INDEX "developer_tasks_client_id_idx" ON "developer_tasks"("client_id");

-- CreateIndex
CREATE INDEX "developer_tasks_status_idx" ON "developer_tasks"("status");

-- CreateIndex
CREATE INDEX "developer_task_notes_task_id_idx" ON "developer_task_notes"("task_id");

-- CreateIndex
CREATE INDEX "developer_task_screenshots_task_id_idx" ON "developer_task_screenshots"("task_id");

-- AddForeignKey
ALTER TABLE "developer_tasks" ADD CONSTRAINT "developer_tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "developer_tasks" ADD CONSTRAINT "developer_tasks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "developer_task_notes" ADD CONSTRAINT "developer_task_notes_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "developer_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "developer_task_screenshots" ADD CONSTRAINT "developer_task_screenshots_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "developer_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
