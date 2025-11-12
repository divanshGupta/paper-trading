/*
  Warnings:

  - You are about to alter the column `realizedPnl` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "public"."Transaction" ALTER COLUMN "realizedPnl" SET DATA TYPE DECIMAL(10,2);
