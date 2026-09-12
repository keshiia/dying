-- 1) 清理历史残留表
--
-- 这 5 张表来自迁移 `20260728000000_add_ai_personalization`，该迁移曾被应用到
-- 本地数据库但从未提交进仓库，其后继设计（StudentProfile / AiChatMessage）取代了它们。
-- 表内均为 0 行，代码中 0 引用。
--
-- 必须用 IF EXISTS：全新部署的数据库（走仓库里的迁移）从来没有创建过这些表，
-- 无条件 DROP 会让容器启动时的 `prisma migrate deploy` 直接失败。
-- 删除顺序：ChatMessage / RiskFlag 引用 ChatSession，必须排在其前面。
DROP TABLE IF EXISTS `AnswerRecord`;
DROP TABLE IF EXISTS `ChatMessage`;
DROP TABLE IF EXISTS `RiskFlag`;
DROP TABLE IF EXISTS `ChatSession`;
DROP TABLE IF EXISTS `UserProfile`;

-- 2) 学生 AI 对话风险预警
CREATE TABLE `RiskEvent` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NULL,
    `kind` VARCHAR(191) NOT NULL,
    `level` ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL,
    `snippet` TEXT NOT NULL,
    `summary` TEXT NULL,
    `suggestion` TEXT NULL,
    `triggerCount` INTEGER NOT NULL DEFAULT 1,
    `lastSeenAt` DATETIME(3) NOT NULL,
    `status` ENUM('OPEN', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'OPEN',
    `handledBy` VARCHAR(191) NULL,
    `handledNote` TEXT NULL,
    `handledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RiskEvent_studentId_kind_status_idx`(`studentId`, `kind`, `status`),
    INDEX `RiskEvent_status_lastSeenAt_idx`(`status`, `lastSeenAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RiskEvent` ADD CONSTRAINT `RiskEvent_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
