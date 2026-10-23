-- AlterTable
ALTER TABLE "ExerciseSet" ADD COLUMN "plannedExerciseId" TEXT;

-- AddForeignKey
ALTER TABLE "ExerciseSet" ADD CONSTRAINT "ExerciseSet_plannedExerciseId_fkey" FOREIGN KEY ("plannedExerciseId") REFERENCES "PlannedExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
