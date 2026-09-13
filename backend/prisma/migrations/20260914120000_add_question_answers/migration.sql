-- 逐题作答记录，用于把「智能错题复盘」的题型正确率变成真实统计。
--
-- 原先 Attempt 只存每关的总分与做对题数，题型正确率只能靠把错题数按题目数量
-- 平均分摊来估算：某关 5 题错 1~2 题则所有题型都算 100%，错 3 题以上则全部算 0%，
-- 阈值卡在 50%，与题型毫无关系。
CREATE TABLE `QuestionAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `levelId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `answer` VARCHAR(191) NOT NULL,
    `correct` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `QuestionAnswer_studentId_questionId_idx`(`studentId`, `questionId`),
    INDEX `QuestionAnswer_studentId_createdAt_idx`(`studentId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `QuestionAnswer` ADD CONSTRAINT `QuestionAnswer_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `QuestionAnswer` ADD CONSTRAINT `QuestionAnswer_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
