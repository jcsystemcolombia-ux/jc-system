/*
  Warnings:

  - A unique constraint covering the columns `[numeroCuenta]` on the table `CuentaCobro` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CuentaCobro" ADD COLUMN     "items" JSONB,
ADD COLUMN     "numeroCuenta" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "nitCedula" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CuentaCobro_numeroCuenta_key" ON "CuentaCobro"("numeroCuenta");
