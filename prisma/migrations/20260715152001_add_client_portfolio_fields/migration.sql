-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "current_focus" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "last_audit_at" TIMESTAMP(3),
ADD COLUMN     "monthly_retainer" INTEGER,
ADD COLUMN     "owner_id" UUID,
ADD COLUMN     "seo_score" INTEGER;

-- CreateIndex
CREATE INDEX "clients_owner_id_idx" ON "clients"("owner_id");

-- CreateIndex
CREATE INDEX "clients_archived_at_idx" ON "clients"("archived_at");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
