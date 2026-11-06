-- SHIF-A AI: private conversations and messages
-- Draft only. Apply only after explicit owner approval.
create table if not exists public.shif_a_conversations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 project_id uuid null references public.shif_a_projects(id) on delete cascade,
 title text not null check (char_length(btrim(title)) between 1 and 140),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint shif_a_conversations_owner_project_unique unique (id,user_id)
);
create index if not exists shif_a_conversations_user_updated_idx on public.shif_a_conversations(user_id,updated_at desc);
create index if not exists shif_a_conversations_project_updated_idx on public.shif_a_conversations(project_id,updated_at desc);
alter table public.shif_a_conversations enable row level security;
drop policy if exists "Users can manage own SHIF-A conversations" on public.shif_a_conversations;
create policy "Users can manage own SHIF-A conversations" on public.shif_a_conversations for all to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
grant select,insert,update,delete on public.shif_a_conversations to authenticated;
revoke all on public.shif_a_conversations from anon,public;

create table if not exists public.shif_a_chat_messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 role text not null check (role in ('user','assistant')),
 content text not null check (char_length(content) between 1 and 20000),
 created_at timestamptz not null default now(),
 constraint shif_a_chat_messages_conversation_owner_fk foreign key (conversation_id,user_id)
 references public.shif_a_conversations(id,user_id) on delete cascade
);
create index if not exists shif_a_chat_messages_conversation_created_idx on public.shif_a_chat_messages(conversation_id,created_at asc);
alter table public.shif_a_chat_messages enable row level security;
drop policy if exists "Users can manage own SHIF-A chat messages" on public.shif_a_chat_messages;
create policy "Users can manage own SHIF-A chat messages" on public.shif_a_chat_messages for all to authenticated
 using ((select auth.uid())=user_id)
 with check ((select auth.uid())=user_id and exists (
  select 1 from public.shif_a_conversations c where c.id=conversation_id and c.user_id=(select auth.uid())
 ));
grant select,insert,update,delete on public.shif_a_chat_messages to authenticated;
revoke all on public.shif_a_chat_messages from anon,public;

create or replace function public.shif_a_touch_conversation()
returns trigger language plpgsql set search_path='' as $$
begin
 update public.shif_a_conversations set updated_at=now()
 where id=new.conversation_id and user_id=new.user_id;
 return new;
end; $$;
drop trigger if exists shif_a_chat_message_touch_conversation on public.shif_a_chat_messages;
create trigger shif_a_chat_message_touch_conversation after insert on public.shif_a_chat_messages
for each row execute function public.shif_a_touch_conversation();
revoke all on function public.shif_a_touch_conversation() from public,anon,authenticated;
