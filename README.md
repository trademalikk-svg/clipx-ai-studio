# ClipX AI Studio

ClipX AI Studio is a Hindi and English browser-based video creator toolkit for preparing short clips, captions, subtitles, thumbnails and video scripts. It is hosted on GitHub Pages and currently offers a free browser mode.

## Free Browser Mode

The public site is configured to avoid unexpected paid-provider charges:
- Cloud video rendering/upload is disabled in the public UI and guarded in its JavaScript.
- External Runway video generation is disabled in the public UI and guarded in its JavaScript.
- Basic browser editing and creator utilities do not require a ClipX subscription.
- Email/password sign-in includes a password-recovery email flow; Google OAuth remains disabled until provider credentials are configured.
- Some browser tools may download libraries or speech models. This uses internet data and depends on device memory, browser support and network speed.

## Current browser tools

- Select a local video up to 3 GB and preview it in the browser. The 3 GB value is a file-selection ceiling, not a guarantee that every device can edit/export a file of that size.
- Trim, split and export clips where browser codecs and MediaRecorder support the selected file.
- Adjust rotation, crop/fit, speed, volume and mute.
- Edit SRT subtitles and use supported browser-side speech tools.
- Generate basic title, description, hashtag and prompt drafts.
- Use the separate Creator Tools page for thumbnail layouts, script templates, subtitle formatting and text utilities.
- Experimental face detection/face-follow tools may depend on model downloads and compatible devices.

## Important limitations

- Automatic Shorts splits by chosen duration; it does not understand speech, story or semantic highlights.
- Smart Highlights uses a visual frame-change heuristic and may select poor segments.
- Template-generated scripts, titles and captions are not fact-checked.
- Speech recognition may use browser/vendor speech services or download a model; it can be inaccurate or fail on low-memory phones. Whisper auto-captions retain a separate 150 MB source-file safeguard because decoding audio can consume substantial memory.
- Face detection/face-follow is experimental.
- Export format and quality depend on browser support; MP4 may not be available on every device.
- YouTube URL preview does not download or process third-party videos.
- No independent security audit, formal load test or full cross-device QA has been completed. Do not use confidential or sensitive footage.
- Supabase account, private 2 GB storage bucket, and authenticated upload Edge Functions are configured. The public Free Browser Mode keeps cloud upload disabled. The separate FFmpeg worker has source code but is not deployed to a processing host, so cloud clip processing is not yet operational. External AI video generation is also disabled.

## Website and ownership

- Live website: https://trademalikk-svg.github.io/clipx-ai-studio/
- Creator Tools: https://trademalikk-svg.github.io/clipx-ai-studio/creator-tools.html
- The GitHub Pages site is public. The repository is public so the site can be hosted on the free GitHub Pages setup; public visibility does not give visitors permission to change the repository. Keep repository owner/admin access under your control and do not add collaborators unless you choose to.

## Deployment and checks

GitHub Actions runs browser JavaScript, worker syntax and Supabase function type checks on changes. Check the Actions tab and confirm the Pages deployment job succeeds before treating the latest changes as live.

## Safe launch checklist

1. Test upload, preview, trim, audio, rotation/crop, and export on the Android devices and desktop browsers you intend to support.
2. Test short and long files, different codecs and low-memory conditions.
3. Keep the Privacy Policy and Terms aligned with the actual enabled features and data flow.
4. Add a real support email only if you want one displayed publicly; no email address is invented in this project.
5. Do not enable optional cloud or AI services unless their provider costs, privacy terms, quotas and security controls are understood.
6. Run independent security and load testing before promoting the site to a large audience.

## Development and secrets

Never commit API keys, Supabase service-role keys, passwords, OTPs, .env files or private user data. Public browser code must contain only publishable client-side configuration; privileged keys belong only in a trusted server-side secret manager.
