-- CreateTable
CREATE TABLE "ConfigRecordatorios" (
    "id" SERIAL NOT NULL,
    "diasEspera" INTEGER NOT NULL DEFAULT 3,
    "frecuencia" TEXT NOT NULL DEFAULT 'diario',
    "hora" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigRecordatorios_pkey" PRIMARY KEY ("id")
);
