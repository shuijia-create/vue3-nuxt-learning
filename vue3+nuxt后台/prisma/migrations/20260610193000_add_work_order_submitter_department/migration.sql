ALTER TABLE `work_orders`
  ADD COLUMN `submitter_dept_name` VARCHAR(50) NULL;

UPDATE `work_orders` AS wo
INNER JOIN `users` AS u ON wo.`created_by` = u.`id`
SET
  wo.`submitter` = u.`nickname`,
  wo.`submitter_dept_name` = u.`department_name`;
