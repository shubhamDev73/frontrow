CREATE TABLE `user` (
  `id` bigint PRIMARY KEY COMMENT 'facebook id',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_page` boolean DEFAULT false,
  `join_time` datetime NOT NULL COMMENT 'facebook joining time',
  `friends` int NOT NULL,
  `groups` int NOT NULL,
  `lives` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT null,
  `work` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT null COMMENT 'if page, page description',
  `study` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT null
);

CREATE TABLE `community` (
  `id` bigint PRIMARY KEY COMMENT 'facebook id',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci UNIQUE,
  `created_on` datetime NOT NULL
);

CREATE TABLE `activity` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `user` bigint,
  `community` bigint,
  `join_time` datetime NOT NULL,
  `leave_time` datetime DEFAULT null,
  `user_type` ENUM ('member', 'admin', 'moderator', 'creator', 'banned') DEFAULT "member"
);

CREATE TABLE `answer` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `activity` int,
  `question` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
);

CREATE TABLE `post` (
  `id` bigint PRIMARY KEY COMMENT 'facebook id',
  `community` bigint,
  `user` bigint,
  `time` datetime NOT NULL,
  `type` ENUM ('post', 'shared_a_post', 'shared_a_link', 'first_post') DEFAULT "post",
  `text` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `likes` int NOT NULL,
  `shares` int NOT NULL
);

CREATE TABLE `comment` (
  `id` bigint PRIMARY KEY COMMENT 'facebook id',
  `post` bigint,
  `comment` bigint DEFAULT null COMMENT 'if reply, the comment which it is reply of',
  `user` bigint,
  `time` datetime NOT NULL,
  `text` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `likes` int NOT NULL
);

ALTER TABLE `activity` ADD FOREIGN KEY (`user`) REFERENCES `user` (`id`);

ALTER TABLE `activity` ADD FOREIGN KEY (`community`) REFERENCES `community` (`id`);

ALTER TABLE `answer` ADD FOREIGN KEY (`activity`) REFERENCES `activity` (`id`);

ALTER TABLE `post` ADD FOREIGN KEY (`community`) REFERENCES `community` (`id`);

ALTER TABLE `post` ADD FOREIGN KEY (`user`) REFERENCES `user` (`id`);

ALTER TABLE `comment` ADD FOREIGN KEY (`post`) REFERENCES `post` (`id`);

ALTER TABLE `comment` ADD FOREIGN KEY (`comment`) REFERENCES `comment` (`id`);

ALTER TABLE `comment` ADD FOREIGN KEY (`user`) REFERENCES `user` (`id`);
