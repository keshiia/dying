-- DropForeignKey
ALTER TABLE `assignment` DROP FOREIGN KEY `Assignment_classId_fkey`;

-- DropForeignKey
ALTER TABLE `assignmentsubmission` DROP FOREIGN KEY `AssignmentSubmission_assignmentId_fkey`;

-- DropForeignKey
ALTER TABLE `assignmentsubmission` DROP FOREIGN KEY `AssignmentSubmission_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `attempt` DROP FOREIGN KEY `Attempt_levelId_fkey`;

-- DropForeignKey
ALTER TABLE `attempt` DROP FOREIGN KEY `Attempt_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `classmember` DROP FOREIGN KEY `ClassMember_classId_fkey`;

-- DropForeignKey
ALTER TABLE `classmember` DROP FOREIGN KEY `ClassMember_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `level` DROP FOREIGN KEY `Level_unitId_fkey`;

-- DropForeignKey
ALTER TABLE `question` DROP FOREIGN KEY `Question_levelId_fkey`;

-- DropForeignKey
ALTER TABLE `resource` DROP FOREIGN KEY `Resource_createdBy_fkey`;

-- DropForeignKey
ALTER TABLE `userprogress` DROP FOREIGN KEY `UserProgress_levelId_fkey`;

-- DropForeignKey
ALTER TABLE `userprogress` DROP FOREIGN KEY `UserProgress_studentId_fkey`;

-- CreateTable
CREATE TABLE `ComicRead` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `storyId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ComicRead_studentId_idx`(`studentId`),
    UNIQUE INDEX `ComicRead_studentId_storyId_key`(`studentId`, `storyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ClassMember` ADD CONSTRAINT `ClassMember_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassMember` ADD CONSTRAINT `ClassMember_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Level` ADD CONSTRAINT `Level_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `LearningUnit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_levelId_fkey` FOREIGN KEY (`levelId`) REFERENCES `Level`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attempt` ADD CONSTRAINT `Attempt_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attempt` ADD CONSTRAINT `Attempt_levelId_fkey` FOREIGN KEY (`levelId`) REFERENCES `Level`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserProgress` ADD CONSTRAINT `UserProgress_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserProgress` ADD CONSTRAINT `UserProgress_levelId_fkey` FOREIGN KEY (`levelId`) REFERENCES `Level`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssignmentSubmission` ADD CONSTRAINT `AssignmentSubmission_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `Assignment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssignmentSubmission` ADD CONSTRAINT `AssignmentSubmission_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComicRead` ADD CONSTRAINT `ComicRead_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
