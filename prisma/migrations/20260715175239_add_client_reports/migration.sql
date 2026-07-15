-- CreateTable
CREATE TABLE "client_reports" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "period" TEXT,
    "summary" TEXT,
    "url" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_reports_client_id_idx" ON "client_reports"("client_id");

-- CreateIndex
CREATE INDEX "clients_contact_email_idx" ON "clients"("contact_email");

-- AddForeignKey
ALTER TABLE "client_reports" ADD CONSTRAINT "client_reports_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
