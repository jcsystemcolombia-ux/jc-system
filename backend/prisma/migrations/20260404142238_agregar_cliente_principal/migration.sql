-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "clientePrincipalId" INTEGER;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_clientePrincipalId_fkey" FOREIGN KEY ("clientePrincipalId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
