-- DropForeignKey
ALTER TABLE "PlanSuggestion" DROP CONSTRAINT "PlanSuggestion_userId_fkey";

-- DropTable
DROP TABLE "PlanSuggestion";

-- DropEnum
DROP TYPE "SuggestionStatus";
