-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "SearchDimension" AS ENUM ('QUERY', 'PAGE');

-- CreateTable
CREATE TABLE "search_console_connections" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "site_url" TEXT NOT NULL,
    "refresh_token" TEXT,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_console_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_analytics_rows" (
    "id" UUID NOT NULL,
    "connection_id" UUID NOT NULL,
    "dimension" "SearchDimension" NOT NULL,
    "key_value" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "clicks" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_analytics_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_coverage" (
    "id" UUID NOT NULL,
    "connection_id" UUID NOT NULL,
    "page" TEXT NOT NULL,
    "coverage_state" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "last_crawled_at" TIMESTAMP(3),
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_coverage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "search_console_connections_client_id_site_url_key" ON "search_console_connections"("client_id", "site_url");

-- CreateIndex
CREATE INDEX "search_analytics_rows_connection_id_dimension_date_idx" ON "search_analytics_rows"("connection_id", "dimension", "date");

-- CreateIndex
CREATE UNIQUE INDEX "search_analytics_rows_connection_id_dimension_key_value_dat_key" ON "search_analytics_rows"("connection_id", "dimension", "key_value", "date");

-- CreateIndex
CREATE UNIQUE INDEX "page_coverage_connection_id_page_key" ON "page_coverage"("connection_id", "page");

-- AddForeignKey
ALTER TABLE "search_console_connections" ADD CONSTRAINT "search_console_connections_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_analytics_rows" ADD CONSTRAINT "search_analytics_rows_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "search_console_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_coverage" ADD CONSTRAINT "page_coverage_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "search_console_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
