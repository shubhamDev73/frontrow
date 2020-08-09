CREATE TABLE `user` (
  `id` varchar(50) PRIMARY KEY COMMENT 'facebook id',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_page` boolean DEFAULT false,
  `join_time` datetime NOT NULL COMMENT 'facebook joining time',
  `friends` int NOT NULL,
  `groups` int NOT NULL,
  `lives` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT null,
  `work` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT null COMMENT 'if page, page description',
  `study` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT null
);

CREATE TABLE `group` (
  `id` bigint PRIMARY KEY COMMENT 'facebook id',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci UNIQUE,
  `created_on` datetime NOT NULL
);

CREATE TABLE `member` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `user` varchar(50),
  `group` bigint,
  `join_time` datetime NOT NULL,
  `leave_time` datetime DEFAULT null,
  `member_type` ENUM ('member', 'admin', 'moderator', 'creator', 'banned') DEFAULT "member"
);

CREATE TABLE `answer` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `member` int,
  `question` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
);

CREATE TABLE `special_member` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `member` int,
  `join_time` datetime NOT NULL,
  `leave_time` datetime DEFAULT NULL,
  `member_type` ENUM ('admin', 'moderator', 'creator', 'banned') NOT NULL
);

CREATE TABLE `post` (
  `id` bigint PRIMARY KEY COMMENT 'facebook id',
  `group` bigint,
  `user` varchar(50),
  `time` datetime NOT NULL,
  `type` ENUM ('post', 'poll', 'first', 'link', 'share', 'with') DEFAULT "post",
  `text` varchar(6000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `likes` int NOT NULL,
  `shares` int NOT NULL,
  `error` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT null
);

CREATE TABLE `comment` (
  `id` bigint PRIMARY KEY COMMENT 'facebook id',
  `post` bigint,
  `comment` bigint DEFAULT null COMMENT 'if reply, the comment which it is reply of',
  `user` varchar(50),
  `time` datetime NOT NULL,
  `text` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `likes` int NOT NULL,
  `error` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT null
);

ALTER TABLE `member` ADD FOREIGN KEY (`user`) REFERENCES `user` (`id`);

ALTER TABLE `member` ADD FOREIGN KEY (`group`) REFERENCES `group` (`id`);

ALTER TABLE `answer` ADD FOREIGN KEY (`member`) REFERENCES `member` (`id`);

ALTER TABLE `special_member` ADD FOREIGN KEY (`member`) REFERENCES `member` (`id`);

ALTER TABLE `post` ADD FOREIGN KEY (`group`) REFERENCES `group` (`id`);

ALTER TABLE `post` ADD FOREIGN KEY (`user`) REFERENCES `user` (`id`);

ALTER TABLE `comment` ADD FOREIGN KEY (`post`) REFERENCES `post` (`id`);

ALTER TABLE `comment` ADD FOREIGN KEY (`comment`) REFERENCES `comment` (`id`);

ALTER TABLE `comment` ADD FOREIGN KEY (`user`) REFERENCES `user` (`id`);
