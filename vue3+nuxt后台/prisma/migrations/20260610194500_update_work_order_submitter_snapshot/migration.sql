UPDATE `work_orders` AS wo
INNER JOIN `users` AS u ON wo.`created_by` = u.`id`
SET wo.`submitter` = CASE
  WHEN u.`nickname` <> u.`username` THEN CONCAT(u.`nickname`, '（', u.`username`, '）')
  ELSE u.`nickname`
END;
