-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "contentHtml" TEXT,
ADD COLUMN     "status" "public"."MessageStatus" NOT NULL DEFAULT 'SENT',
ADD COLUMN     "type" "public"."MessageType" NOT NULL DEFAULT 'TEXT';
