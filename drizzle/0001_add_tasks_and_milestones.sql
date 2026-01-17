CREATE TABLE "task" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"dueDate" timestamp,
	"priority" text,
	"tags" text[],
	"progress" integer DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"createDate" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);

CREATE TABLE "milestone" (
	"id" text PRIMARY KEY NOT NULL,
	"taskId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"createDate" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);

ALTER TABLE "milestone" ADD CONSTRAINT "milestone_taskId_task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "task" ADD CONSTRAINT "task_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "milestone_task_id_idx" ON "milestone" USING btree ("taskId");

CREATE INDEX "task_user_id_idx" ON "task" USING btree ("userId");

CREATE INDEX "task_archived_idx" ON "task" USING btree ("archived");

CREATE INDEX "task_due_date_idx" ON "task" USING btree ("dueDate");
