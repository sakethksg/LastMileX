-- CreateEnum
CREATE TYPE "payment_type" AS ENUM ('PREPAID', 'COD');

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "payment_type" TYPE "payment_type" USING ("payment_type"::"payment_type");
