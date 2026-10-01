CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`name` text NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `project_drafts` (
	`project_id` text PRIMARY KEY NOT NULL,
	`draft_json` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_sections` (
	`key` text PRIMARY KEY NOT NULL,
	`draft_json` text NOT NULL,
	`published_json` text NOT NULL,
	`updated_at` text NOT NULL,
	`published_at` text NOT NULL
);
