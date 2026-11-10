#!/usr/bin/env python3
"""Temporary FFmpeg worker for Supabase clip_jobs.

This worker is intentionally manual-dispatch only. It never deletes the source
video. Source deletion and 24-hour result cleanup must be enabled only after
the processing flow is tested end-to-end.
"""
import json
import os
import pathlib
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

BASE = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
JOB_ID = os.environ.get("CLIP_JOB_ID", "")
CLIP_SECONDS = int(os.environ.get("CLIP_SECONDS", "30"))
BUCKET = "clipx-private"


def request(method, url, data=None, headers=None):
    body = data
    req = urllib.request.Request(url, data=body, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:1000]
        raise RuntimeError(f"Supabase HTTP {exc.code}: {detail}") from exc


def api_headers(extra=None):
    h = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
    if extra:
        h.update(extra)
    return h


def main():
    if not BASE.startswith("https://") or not KEY or not JOB_ID:
        raise RuntimeError("Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or CLIP_JOB_ID.")
    if not 5 <= CLIP_SECONDS <= 180:
        raise RuntimeError("clip_seconds must be between 5 and 180.")

    query = urllib.parse.urlencode({"id": f"eq.{JOB_ID}", "select": "id,user_id,source_path,source_name,status,options"})
    rows = json.loads(request("GET", f"{BASE}/rest/v1/clip_jobs?{query}", headers=api_headers()))
    if len(rows) != 1:
        raise RuntimeError("Clip job not found.")
    job = rows[0]
    if job["status"] != "uploaded":
        raise RuntimeError(f"Job status must be uploaded; current status is {job['status']}.")

    source_path = job["source_path"]
    if not source_path.startswith(job["user_id"] + "/"):
        raise RuntimeError("Source path does not belong to the job owner.")

    tmp = pathlib.Path("/tmp/clipx-worker")
    tmp.mkdir(parents=True, exist_ok=True)
    source = tmp / "source-video"
    encoded_path = urllib.parse.quote(source_path, safe="/")
    source_bytes = request(
        "GET",
        f"{BASE}/storage/v1/object/{BUCKET}/{encoded_path}",
        headers=api_headers(),
    )
    source.write_bytes(source_bytes)
    if source.stat().st_size == 0:
        raise RuntimeError("Downloaded source video is empty.")

    probe = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(source)
    ], text=True).strip()
    duration = float(probe)
    if duration <= 0:
        raise RuntimeError("Could not determine source video duration.")

    clips = []
    start = 0.0
    index = 1
    while start < duration:
        length = min(float(CLIP_SECONDS), duration - start)
        output = tmp / f"clip-{index:03d}.mp4"
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-ss", str(start), "-i", str(source), "-t", str(length),
            "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
            "-pix_fmt", "yuv420p", str(output)
        ], check=True)
        if not output.exists() or output.stat().st_size == 0:
            raise RuntimeError(f"FFmpeg did not produce clip {index}.")
        clips.append((output, start, length))
        start += length
        index += 1

    uploaded = []
    for output, clip_start, clip_length in clips:
        result_path = f"{job['user_id']}/{JOB_ID}/shorts/{output.name}"
        object_path = urllib.parse.quote(result_path, safe="/")
        request(
            "POST",
            f"{BASE}/storage/v1/object/{BUCKET}/{object_path}",
            data=output.read_bytes(),
            headers=api_headers({
                "Content-Type": "video/mp4",
                "x-upsert": "true",
            }),
        )
        uploaded.append({
            "path": result_path,
            "start_seconds": round(clip_start, 2),
            "duration_seconds": round(clip_length, 2),
        })

    expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    result = {
        "processor": "ffmpeg-github-actions-test",
        "clips": uploaded,
        "retention_expires_at": expires,
        "source_deleted": False,
    }
    patch_query = urllib.parse.urlencode({"id": f"eq.{JOB_ID}"})
    patch_body = json.dumps({"status": "completed", "result": result}).encode()
    request(
        "PATCH",
        f"{BASE}/rest/v1/clip_jobs?{patch_query}",
        data=patch_body,
        headers=api_headers({
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }),
    )
    print(json.dumps({"job_id": JOB_ID, "status": "completed", "clips": uploaded, "expires_at": expires}))
    print("Source retained intentionally; 24-hour cleanup scheduler is not enabled yet.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"WORKER FAILED: {exc}", file=sys.stderr)
        sys.exit(1)
