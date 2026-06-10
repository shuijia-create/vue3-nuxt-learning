ALTER TABLE `users`
  ADD COLUMN `department_name` VARCHAR(50) NULL,
  ADD COLUMN `is_department_manager` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `work_orders`
  ADD COLUMN `handler_dept_name` VARCHAR(50) NOT NULL DEFAULT 'IT 部';

UPDATE `work_orders`
SET `handler_dept_name` = CASE `type`
  WHEN 1 THEN '维修部'
  WHEN 2 THEN 'IT 部'
  WHEN 3 THEN '质量部'
  WHEN 4 THEN '行政部'
  WHEN 5 THEN '系统管理员'
  WHEN 6 THEN '安环部'
  ELSE 'IT 部'
END;

CREATE INDEX `work_orders_created_by_idx` ON `work_orders`(`created_by`);
CREATE INDEX `work_orders_assignee_idx` ON `work_orders`(`assignee_id`);
CREATE INDEX `work_orders_handler_dept_status_idx` ON `work_orders`(`handler_dept_name`, `status`);
