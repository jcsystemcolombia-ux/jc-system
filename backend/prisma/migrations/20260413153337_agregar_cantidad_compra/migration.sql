/*
  Warnings:

  - You are about to drop the column `valor` on the `Compra` table. All the data in the column will be lost.
  - Added the required column `valorTotal` to the `Compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valorUnitario` to the `Compra` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Compra" 
ADD COLUMN "cantidad" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "cantidadDisponible" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "tipoUso" TEXT,
ADD COLUMN "valorTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "valorUnitario" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Copiar valor existente a valorUnitario y valorTotal
UPDATE "Compra" SET "valorUnitario" = "valor", "valorTotal" = "valor";

-- Eliminar columna valor
ALTER TABLE "Compra" DROP COLUMN "valor";