/*
  Warnings:

  - A unique constraint covering the columns `[citaId]` on the table `Servicio` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Servicio" ADD COLUMN     "citaId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Servicio_citaId_key" ON "Servicio"("citaId");

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita"("id") ON DELETE SET NULL ON UPDATE CASCADE;
