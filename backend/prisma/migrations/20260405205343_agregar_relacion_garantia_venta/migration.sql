-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_garantiaVentaId_fkey" FOREIGN KEY ("garantiaVentaId") REFERENCES "Venta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
