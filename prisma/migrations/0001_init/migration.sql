CREATE TABLE `User` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `role` enum('STUDENT','TEACHER') NOT NULL,
  `nickname` varchar(191) NOT NULL,
  `grade` varchar(191) DEFAULT NULL,
  `xp` int NOT NULL DEFAULT 0,
  `level` int NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Class` (
  `id` varchar(191) NOT NULL,
  `teacherId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `joinCode` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Class_joinCode_key` (`joinCode`),
  KEY `Class_teacherId_idx` (`teacherId`),
  CONSTRAINT `Class_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ClassMember` (
  `id` varchar(191) NOT NULL,
  `classId` varchar(191) NOT NULL,
  `studentId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ClassMember_classId_studentId_key` (`classId`,`studentId`),
  KEY `ClassMember_studentId_idx` (`studentId`),
  CONSTRAINT `ClassMember_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ClassMember_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LearningUnit` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `gradeRange` varchar(191) NOT NULL,
  `orderNo` int NOT NULL,
  `isActive` boolean NOT NULL DEFAULT true,
  PRIMARY KEY (`id`),
  KEY `LearningUnit_orderNo_idx` (`orderNo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Level` (
  `id` varchar(191) NOT NULL,
  `unitId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `orderNo` int NOT NULL,
  `xpReward` int NOT NULL DEFAULT 10,
  `isActive` boolean NOT NULL DEFAULT true,
  PRIMARY KEY (`id`),
  KEY `Level_unitId_orderNo_idx` (`unitId`,`orderNo`),
  CONSTRAINT `Level_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `LearningUnit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Question` (
  `id` varchar(191) NOT NULL,
  `levelId` varchar(191) NOT NULL,
  `type` enum('SINGLE','TRUE_FALSE','SCENARIO') NOT NULL,
  `prompt` text NOT NULL,
  `optionsJson` text DEFAULT NULL,
  `answerKey` varchar(191) NOT NULL,
  `explanation` text DEFAULT NULL,
  `orderNo` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Question_levelId_orderNo_idx` (`levelId`,`orderNo`),
  CONSTRAINT `Question_levelId_fkey` FOREIGN KEY (`levelId`) REFERENCES `Level`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Attempt` (
  `id` varchar(191) NOT NULL,
  `studentId` varchar(191) NOT NULL,
  `levelId` varchar(191) NOT NULL,
  `score` int NOT NULL,
  `correctCount` int NOT NULL,
  `totalCount` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Attempt_studentId_createdAt_idx` (`studentId`,`createdAt`),
  KEY `Attempt_levelId_idx` (`levelId`),
  CONSTRAINT `Attempt_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Attempt_levelId_fkey` FOREIGN KEY (`levelId`) REFERENCES `Level`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UserProgress` (
  `id` varchar(191) NOT NULL,
  `studentId` varchar(191) NOT NULL,
  `levelId` varchar(191) NOT NULL,
  `status` enum('NOT_STARTED','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'NOT_STARTED',
  `bestScore` int NOT NULL DEFAULT 0,
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserProgress_studentId_levelId_key` (`studentId`,`levelId`),
  KEY `UserProgress_levelId_idx` (`levelId`),
  CONSTRAINT `UserProgress_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserProgress_levelId_fkey` FOREIGN KEY (`levelId`) REFERENCES `Level`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Resource` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `type` enum('CASE','LAW_SUMMARY','VIDEO','ARTICLE') NOT NULL,
  `tagsJson` text NOT NULL,
  `contentUrl` text DEFAULT NULL,
  `contentMd` text DEFAULT NULL,
  `createdBy` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Resource_type_idx` (`type`),
  KEY `Resource_createdBy_idx` (`createdBy`),
  CONSTRAINT `Resource_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Assignment` (
  `id` varchar(191) NOT NULL,
  `classId` varchar(191) NOT NULL,
  `targetType` enum('LEVEL','RESOURCE') NOT NULL,
  `targetId` varchar(191) NOT NULL,
  `dueAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Assignment_classId_createdAt_idx` (`classId`,`createdAt`),
  CONSTRAINT `Assignment_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AssignmentSubmission` (
  `id` varchar(191) NOT NULL,
  `assignmentId` varchar(191) NOT NULL,
  `studentId` varchar(191) NOT NULL,
  `submittedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `AssignmentSubmission_assignmentId_studentId_key` (`assignmentId`,`studentId`),
  KEY `AssignmentSubmission_studentId_submittedAt_idx` (`studentId`,`submittedAt`),
  CONSTRAINT `AssignmentSubmission_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `Assignment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `AssignmentSubmission_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
