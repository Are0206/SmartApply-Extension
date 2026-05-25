-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL DEFAULT '',
    "apellido" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "telefono" TEXT NOT NULL DEFAULT '',
    "linkedin" TEXT NOT NULL DEFAULT '',
    "portfolio" TEXT NOT NULL DEFAULT '',
    "ubicacion" TEXT NOT NULL DEFAULT '',
    "titulo_profesional" TEXT NOT NULL DEFAULT '',
    "resumen" TEXT NOT NULL DEFAULT '',
    "experiencia" TEXT NOT NULL DEFAULT '',
    "educacion" TEXT NOT NULL DEFAULT '',
    "habilidades" TEXT NOT NULL DEFAULT '[]',
    "github" TEXT NOT NULL DEFAULT '',
    "salario" TEXT NOT NULL DEFAULT '',
    "disponibilidad" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ActionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "fields" TEXT NOT NULL DEFAULT '[]',
    "url" TEXT NOT NULL DEFAULT 'desconocido',
    "status" TEXT NOT NULL DEFAULT 'completado',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
