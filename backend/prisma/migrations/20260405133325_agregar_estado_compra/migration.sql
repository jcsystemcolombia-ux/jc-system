/*
  Warnings:

  - A unique constraint covering the columns `[ventaId]` on the table `Compra` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Compra" ADD COLUMN     "condicion" TEXT,
ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'disponible',
ADD COLUMN     "tipoProducto" TEXT,
ADD COLUMN     "ventaId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Compra_ventaId_key" ON "Compra"("ventaId");
