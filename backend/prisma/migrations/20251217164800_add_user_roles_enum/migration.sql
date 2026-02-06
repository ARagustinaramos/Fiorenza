/*
  Warnings:

  - The `rol` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MAYORISTA', 'MINORISTA');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "rol",
ADD COLUMN     "rol" "Role" NOT NULL DEFAULT 'MAYORISTA';
