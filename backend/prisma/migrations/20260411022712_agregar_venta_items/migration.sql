/*
  Warnings:

  - You are about to drop the column `condicion` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the column `ganancia` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the column `producto` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the column `proveedor` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the column `tipoProducto` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the column `valorCompra` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the column `valorVenta` on the `Venta` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Venta" DROP COLUMN "condicion",
DROP COLUMN "ganancia",
DROP COLUMN "producto",
DROP COLUMN "proveedor",
DROP COLUMN "tipoProducto",
DROP COLUMN "valorCompra",
DROP COLUMN "valorVenta";

-- CreateTable
CREATE TABLE "VentaItem" (
    "id" SERIAL NOT NULL,
    "producto" TEXT NOT NULL,
    "proveedor" TEXT,
    "proveedorId" INTEGER,
    "valorCompra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorVenta" DOUBLE PRECISION NOT NULL,
    "ganancia" DOUBLE PRECISION NOT NULL,
    "tipoProducto" TEXT,
    "condicion" TEXT,
    "compraId" INTEGER,
    "ventaId" INTEGER NOT NULL,

    CONSTRAINT "VentaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VentaItem_compraId_key" ON "VentaItem"("compraId");

-- AddForeignKey
ALTER TABLE "VentaItem" ADD CONSTRAINT "VentaItem_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
