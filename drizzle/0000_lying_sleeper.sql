CREATE TABLE `cms_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`short_description` text DEFAULT '' NOT NULL,
	`card_headline` text DEFAULT '' NOT NULL,
	`tags_json` text DEFAULT '[]' NOT NULL,
	`project_type` text DEFAULT '' NOT NULL,
	`platform` text DEFAULT '' NOT NULL,
	`role` text DEFAULT '' NOT NULL,
	`focus` text DEFAULT '' NOT NULL,
	`status_label` text DEFAULT 'Concept' NOT NULL,
	`year` text DEFAULT '' NOT NULL,
	`card_layout` text DEFAULT 'landscape' NOT NULL,
	`card_image_url` text DEFAULT '' NOT NULL,
	`card_image_alt` text DEFAULT '' NOT NULL,
	`hero_image_url` text DEFAULT '' NOT NULL,
	`hero_image_alt` text DEFAULT '' NOT NULL,
	`gallery_json` text DEFAULT '[]' NOT NULL,
	`accent_color` text DEFAULT '#ff6b2c' NOT NULL,
	`featured` integer DEFAULT true NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`content_markdown` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`published_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE INDEX `projects_publishing_order_idx` ON `projects` (`published`,`featured`,`sort_order`);
