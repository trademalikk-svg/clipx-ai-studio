import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.0";

const CORS = {
  "Access-Control-Allow-Origin": "https://trademalikk-svg.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
const digest = async (value: string) => hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply({ error: "POST required." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return reply({ error: "Team access service unavailable." }, 503);

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return reply({ error: "Sign in required." }, 401);
  const jwt = authHeader.slice(7).trim();
  if (!jwt || jwt.length > 8192) return reply({ error: "Invalid session." }, 401);

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 4096) return reply({ error: "Request too large." }, 413);
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid");
  } catch { return reply({ error: "Invalid request." }, 400); }

  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(jwt);
  const user = authData?.user;
  if (authError || !user || !user.email_confirmed_at || !user.email) {
    return reply({ error: "Verified sign-in required." }, 401);
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const action = body.action;

  if (action === "create_invitation") {
    if (typeof body.project_id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.project_id) ||
        typeof body.email !== "string" || body.email.length > 254 ||
        typeof body.role !== "string" || !["admin","editor","ai_user","viewer"].includes(body.role)) {
      return reply({ error: "Project, email या role अमान्य है।" }, 400);
    }
    const email = body.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({ error: "Valid email address required." }, 400);
    const { data: project, error: projectError } = await admin.from("shif_a_projects")
      .select("id,user_id,name").eq("id", body.project_id).maybeSingle();
    if (projectError) return reply({ error: "Project access check failed." }, 503);
    if (!project || project.user_id !== user.id) return reply({ error: "Only the project owner can invite members." }, 403);

    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = hex(tokenBytes);
    const tokenHash = await digest(token);
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    const { data: invitation, error: insertError } = await admin.from("shif_a_project_invitations")
      .insert({ project_id: project.id, invited_email: email, role: body.role,
        token_hash: tokenHash, expires_at: expiresAt, invited_by: user.id, status: "pending" })
      .select("id").single();
    if (insertError) {
      console.error("Invitation insert failed:", insertError.message);
      return reply({ error: "Invitation create नहीं हो सकी। Migration लागू है या नहीं जाँचें।" }, 503);
    }
    const { error: auditError } = await admin.from("shif_a_access_audit").insert({
      project_id: project.id, actor_user_id: user.id, action: "invitation_created",
      details: { invitation_id: invitation.id, role: body.role, email_domain: email.split("@")[1] }
    });
    if (auditError) {
      await admin.from("shif_a_project_invitations").delete().eq("id", invitation.id);
      return reply({ error: "Audit record save नहीं हुआ; invitation cancel कर दी गई।" }, 503);
    }
    return reply({ invitation_id: invitation.id, project_name: project.name, email,
      role: body.role, expires_at: expiresAt, token, shown_once: true,
      delivery: "Copy this one-time invitation token and share it securely with the invited person." });
  }

  if (action === "accept_invitation") {
    if (typeof body.token !== "string" || !/^[a-f0-9]{64}$/i.test(body.token)) {
      return reply({ error: "Invitation token अमान्य है।" }, 400);
    }
    const tokenHash = await digest(body.token.toLowerCase());
    const { data, error } = await admin.rpc("shif_a_accept_project_invitation", {
      p_user_id: user.id, p_verified_email: user.email.toLowerCase(), p_token_hash: tokenHash
    });
    if (error) {
      console.error("Invitation acceptance failed:", error.message);
      return reply({ error: "Invitation acceptance service unavailable." }, 503);
    }
    const accepted = Array.isArray(data) ? data[0] : null;
    if (!accepted) return reply({ error: "Invitation expired, already used, or email does not match." }, 400);
    return reply({ accepted: true, project_id: accepted.project_id, role: accepted.role });
  }

  if (action === "update_member") {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (typeof body.project_id !== "string" || !uuid.test(body.project_id) ||
        typeof body.member_user_id !== "string" || !uuid.test(body.member_user_id)) {
      return reply({ error: "Project या member identifier अमान्य है।" }, 400);
    }
    const allowed = ["admin","editor","ai_user","viewer"];
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const audit: Array<{action:string;details:Record<string,unknown>}> = [];
    if (body.role !== undefined) {
      if (typeof body.role !== "string" || !allowed.includes(body.role)) return reply({ error: "Role अमान्य है।" }, 400);
      patch.role = body.role;
      audit.push({ action: "member_role_changed", details: { role: body.role } });
    }
    const limits: Array<[string, number, number]> = [
      ["ai_messages_per_24h", 0, 1000],
      ["storage_limit_bytes", 0, 10737418240],
      ["max_file_size_bytes", 1, 20971520]
    ];
    for (const [field, min, max] of limits) {
      if (body[field] !== undefined) {
        const value = body[field];
        if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max) {
          return reply({ error: "Member limit अमान्य है: " + field }, 400);
        }
        patch[field] = value;
        audit.push({ action: "member_limits_changed", details: { [field]: value } });
      }
    }
    if (Object.keys(patch).length === 1) return reply({ error: "बदलने के लिए role या limit दें।" }, 400);
    const { data: project, error: projectError } = await admin.from("shif_a_projects")
      .select("id,user_id").eq("id", body.project_id).maybeSingle();
    if (projectError) return reply({ error: "Project access check failed." }, 503);
    if (!project || project.user_id !== user.id) return reply({ error: "Only the project owner can change member permissions." }, 403);
    const { data: member, error: memberError } = await admin.from("shif_a_project_members")
      .update(patch).eq("project_id", project.id).eq("user_id", body.member_user_id)
      .select("user_id,role,ai_messages_per_24h,storage_limit_bytes,max_file_size_bytes").maybeSingle();
    if (memberError) return reply({ error: "Member update failed." }, 503);
    if (!member) return reply({ error: "Member not found." }, 404);
    for (const entry of audit) {
      const { error } = await admin.from("shif_a_access_audit").insert({
        project_id: project.id, actor_user_id: user.id, target_user_id: member.user_id,
        action: entry.action, details: entry.details
      });
      if (error) return reply({ updated: true, audit_recorded: false, member,
        warning: "Member update saved, but audit confirmation failed." }, 200);
    }
    return reply({ updated: true, audit_recorded: true, member });
  }

  if (action === "revoke_invitation") {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (typeof body.project_id !== "string" || !uuid.test(body.project_id) ||
        typeof body.invitation_id !== "string" || !uuid.test(body.invitation_id)) {
      return reply({ error: "Project या invitation identifier अमान्य है।" }, 400);
    }
    const { data: project, error: projectError } = await admin.from("shif_a_projects")
      .select("id,user_id").eq("id", body.project_id).maybeSingle();
    if (projectError) return reply({ error: "Project access check failed." }, 503);
    if (!project || project.user_id !== user.id) return reply({ error: "Only the project owner can revoke invitations." }, 403);
    const { data: invite, error: inviteError } = await admin.from("shif_a_project_invitations")
      .update({ status: "revoked" }).eq("id", body.invitation_id)
      .eq("project_id", project.id).eq("status", "pending")
      .select("id,role").maybeSingle();
    if (inviteError) return reply({ error: "Invitation revoke failed." }, 503);
    if (!invite) return reply({ error: "Pending invitation not found." }, 404);
    const { error: auditError } = await admin.from("shif_a_access_audit").insert({
      project_id: project.id, actor_user_id: user.id, action: "invitation_revoked",
      details: { invitation_id: invite.id, role: invite.role }
    });
    return reply({ revoked: true, audit_recorded: !auditError });
  }

  if (action === "revoke_member") {
    if (typeof body.project_id !== "string" || typeof body.member_user_id !== "string") {
      return reply({ error: "Project or member identifier missing." }, 400);
    }
    const { data: project, error: projectError } = await admin.from("shif_a_projects")
      .select("id,user_id").eq("id", body.project_id).maybeSingle();
    if (projectError) return reply({ error: "Project access check failed." }, 503);
    if (!project || project.user_id !== user.id) return reply({ error: "Only the project owner can revoke access." }, 403);
    const { data: member, error: memberError } = await admin.from("shif_a_project_members")
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("project_id", project.id).eq("user_id", body.member_user_id)
      .select("user_id,role").maybeSingle();
    if (memberError) return reply({ error: "Member revoke failed." }, 503);
    if (!member) return reply({ error: "Member not found." }, 404);
    const { error: auditError } = await admin.from("shif_a_access_audit").insert({
      project_id: project.id, actor_user_id: user.id, target_user_id: member.user_id,
      action: "member_revoked", details: { role: member.role }
    });
    if (auditError) return reply({ revoked: true, audit_recorded: false,
      warning: "Access revoked, but audit confirmation failed." }, 200);
    return reply({ revoked: true, audit_recorded: true });
  }

  return reply({ error: "Unsupported action." }, 400);
});
