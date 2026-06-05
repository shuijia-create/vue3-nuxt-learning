-- CreateTable
CREATE TABLE `work_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `type` TINYINT NOT NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `priority` TINYINT NOT NULL DEFAULT 2,
    `submitter` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `source` TINYINT NOT NULL DEFAULT 1,
    `ai_suggestion` JSON NULL,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `work_orders_code_key`(`code`),
    INDEX `work_orders_status_idx`(`status`),
    INDEX `work_orders_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
