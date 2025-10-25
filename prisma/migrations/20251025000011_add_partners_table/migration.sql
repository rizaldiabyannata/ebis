-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "partner_id" UUID;

-- CreateTable
CREATE TABLE "public"."partners" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
