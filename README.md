# ClipX AI Studio

Browser-based video editing prototype hosted with GitHub Pages.

## Current features
- Local video selection and browser preview
- Trim/export, manual clips, and sequential Shorts
- Rotation, crop/fit, speed, volume, and mute controls
- SRT caption editing and browser-side Whisper Tiny transcription
- Activity-based highlight suggestions (frame-difference heuristic, not semantic AI)
- Experimental on-device face detection and face-follow export
- Supabase email/password authentication
- Creator title/description/hashtag templates and prompt helper

## Important limitations
- Cloud AI video generation is **not implemented**. The current Supabase `generate-video` function only checks backend/secret connectivity; it does not call a video model.
- Automatic Shorts currently splits the source video by duration. It does not understand speech, story, or semantic highlights.
- Smart Highlights uses visual frame-change scoring and may select poor segments.
- Whisper Tiny runs in the browser, may download a large model, and can be inaccurate or fail on memory-limited phones.
- Face detection/face-follow is experimental and requires a compatible browser, internet for model download, and sufficient device memory.
- Export depends on browser MediaRecorder/canvas/audio capture support. MP4 is produced only when supported; otherwise WebM is used.
- YouTube URL preview does not download or process third-party videos.
- No formal load, penetration, or cross-device QA has been completed. Do not upload confidential or sensitive footage.
- Supabase authentication alone does not mean user projects are stored securely in a cloud database. Video processing is intended to happen locally in the browser.

## Deployment
GitHub Pages deploys from the repository workflow. Check the Actions tab for the latest commit's deployment result before treating a change as live.

## Safe launch checklist
1. Test upload, preview, pause/resume, trim, audio, rotation/crop, and exports on the target Android devices and desktop browsers.
2. Test short and long files, multiple codecs, and low-memory conditions.
3. Review Supabase Auth settings, allowed redirect URLs, Row Level Security policies, and Edge Function permissions.
4. Add a real support contact and confirm all legal/privacy statements match actual data handling.
5. Before adding cloud AI, use a server-side provider integration with rate limits, quotas, abuse controls, and secrets stored only as server-side secrets. Never put provider keys in frontend code.
6. Run independent security and load testing before public promotion.

## Development notes
Keep provider secrets out of this repository. Never commit API keys, service-role keys, passwords, or private user data.
