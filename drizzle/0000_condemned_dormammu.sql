CREATE TABLE `follows` (
	`user_id` text NOT NULL,
	`media_id` integer NOT NULL,
	`media` text NOT NULL,
	`watched` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `media_id`)
);
--> statement-breakpoint
CREATE TABLE `notices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`read` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`timezone` text DEFAULT 'Asia/Kolkata' NOT NULL,
	`releases` integer DEFAULT true NOT NULL,
	`changes` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`airing_at` integer NOT NULL
);
