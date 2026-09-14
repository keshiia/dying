-- 智能体闭环的数据地基：把「学生具体做错了什么」留下来。
--
-- 在此之前，画像引擎只吃 Attempt（闯关答题），而漫画只有 ComicRead 的一个
-- storyId、侦查和法庭只有 GameResult 的一个 bestPct —— 学生在漫画里读了什么、
-- 在侦查里漏了哪条线索、在法庭上判反了哪条证据，智能体一概不知。
-- 没有这层数据，「主动干预」就只能说出「你这局 60 分」这种没有代差的话。
--
-- 三处改动：
--   1. GameResult.detail —— 单局明细（漏掉的线索、选错的题）。前端上报，
--      只用于诊断，绝不参与 XP 结算。
--   2. ComicRead.quizCorrect/quizOptionId —— 读完后的总结题作答。读完整篇的
--      +10 XP 不受影响，答对才另发 +5，低门槛入口的定位不能动。
--   3. SkillAxis —— 能力轴累计计数器。存计数而不是百分比，因为诊断必须能区分
--      「样本不足」和「掌握度低」：只玩过侦查的学生在 ARGUE（表达论辩）轴上
--      一条样本都没有，报「0 分」既错误又打击人。百分比随时可算，样本量算不回来。
ALTER TABLE `ComicRead` ADD COLUMN `quizCorrect` BOOLEAN NULL,
    ADD COLUMN `quizOptionId` VARCHAR(191) NULL;

ALTER TABLE `GameResult` ADD COLUMN `detail` JSON NULL;

CREATE TABLE `SkillAxis` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `axis` VARCHAR(191) NOT NULL,
    `correct` INTEGER NOT NULL DEFAULT 0,
    `total` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SkillAxis_studentId_idx`(`studentId`),
    UNIQUE INDEX `SkillAxis_studentId_axis_key`(`studentId`, `axis`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `SkillAxis` ADD CONSTRAINT `SkillAxis_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
