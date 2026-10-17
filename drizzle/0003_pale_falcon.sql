CREATE TABLE `crunchy_connections` (
	`user_id` text PRIMARY KEY NOT NULL,
	`encrypted_session` text NOT NULL,
	`connected_at` integer NOT NULL,
	`last_synced_at` integer,
	`last_error` text,
	`cache` text
);
