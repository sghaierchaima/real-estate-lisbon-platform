import "dotenv/config";

import * as bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

const databaseUrl = getRequiredEnvironmentVariable(
  "DATABASE_URL",
);

const adminEmail = getRequiredEnvironmentVariable(
  "INITIAL_ADMIN_EMAIL",
).toLowerCase();

const adminPassword = getRequiredEnvironmentVariable(
  "INITIAL_ADMIN_PASSWORD",
);

const adminFullName =
  process.env.INITIAL_ADMIN_FULL_NAME?.trim() ||
  "Platform Administrator";

if (adminPassword.length < 12) {
  throw new Error(
    "INITIAL_ADMIN_PASSWORD must contain at least 12 characters.",
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

async function seedInitialAdmin(): Promise<void> {
  console.log("Checking the initial administrator account...");

  const existingUser = await prisma.user.findUnique({
    where: {
      email: adminEmail,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (existingUser) {
    if (existingUser.role !== Role.ADMIN) {
      throw new Error(
        `A non-admin account already uses the email ${adminEmail}. ` +
          "The seed will not promote it automatically.",
      );
    }

    console.log(
      `Administrator already exists: ${existingUser.email}`,
    );

    return;
  }

  const passwordHash = await bcrypt.hash(
    adminPassword,
    12,
  );

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: passwordHash,
      fullName: adminFullName,
      role: Role.ADMIN,
      profileCompletion: 100,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
    },
  });

  console.log("Initial administrator created successfully.");
  console.log(`Email: ${admin.email}`);
  console.log(`Role: ${admin.role}`);
  console.log(
    `Created at: ${admin.createdAt.toISOString()}`,
  );
}

async function main(): Promise<void> {
  console.log("Starting database seed...");

  await seedInitialAdmin();

  console.log(
    "Database seed completed successfully.",
  );
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed.");
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });