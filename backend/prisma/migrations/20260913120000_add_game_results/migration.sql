-- 模拟法庭 / 案件侦查的单局最好成绩。
--
-- 这两个游戏的判分逻辑与案件数据都在前端，服务端无从复算成绩，只能采信客户端上报的数字。
-- 记录历史最好成绩后，接口就能像关卡一样「只补发差额」结算 XP，
-- 否则反复提交同一个 caseId 就能反复拿 XP（实测同一案件连打 3 次可拿 90 XP）。
CREATE TABLE `GameResult` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `gameType` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `bestPct` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GameResult_studentId_gameType_idx`(`studentId`, `gameType`),
    UNIQUE INDEX `GameResult_studentId_gameType_caseId_key`(`studentId`, `gameType`, `caseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `GameResult` ADD CONSTRAINT `GameResult_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
