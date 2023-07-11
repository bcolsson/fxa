SET NAMES utf8mb4 COLLATE utf8mb4_bin;

CALL assertPatchLevel('139');

ALTER TABLE `recoveryCodes`
  ADD `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;

ALTER TABLE `securityEvents`
  ADD `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;

ALTER TABLE `totp`
  ADD `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;

UPDATE dbMetadata SET value = '140' WHERE name = 'schema-patch-level';