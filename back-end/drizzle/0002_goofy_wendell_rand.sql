ALTER TABLE "blocked_users" DROP CONSTRAINT "blocked_users_blocker_id_blocked_id_pk";--> statement-breakpoint
ALTER TABLE "chat_participants" DROP CONSTRAINT "chat_participants_chat_id_user_id_pk";--> statement-breakpoint
ALTER TABLE "message_reactions" DROP CONSTRAINT "message_reactions_message_id_user_id_emoji_pk";--> statement-breakpoint
ALTER TABLE "typing_indicators" DROP CONSTRAINT "typing_indicators_chat_id_user_id_pk";--> statement-breakpoint
ALTER TABLE "user_settings" DROP CONSTRAINT "user_settings_user_id_setting_key_pk";--> statement-breakpoint
ALTER TABLE "blocked_users" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocker_id_blocked_id_unique" UNIQUE("blocker_id","blocked_id");--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_chat_id_user_id_unique" UNIQUE("chat_id","user_id");--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_user_id_emoji_unique" UNIQUE("message_id","user_id","emoji");--> statement-breakpoint
ALTER TABLE "typing_indicators" ADD CONSTRAINT "typing_indicators_chat_id_user_id_unique" UNIQUE("chat_id","user_id");--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_setting_key_unique" UNIQUE("user_id","setting_key");