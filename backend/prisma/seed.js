import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@fiorenza.com";
  const adminPassword = "admin123";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("🟡 Admin ya existe, no se crea");
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      rol: "ADMIN",
      activo: true,
      perfil: {
        create: {
          nombreCompleto: "Administrador Fiorenza",
          cuitCuil: "20-00000000-0",
          telefono: "0000000000",
          empresa: "Fiorenza",
          cargo: "Administrador",
          coeficienteVenta: 0,
        },
      },
    },
  });

  console.log("✅ Admin creado correctamente");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
