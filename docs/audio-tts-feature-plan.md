# Audio / Text-to-Speech Feature Plan

**Status:** Planned — Next Version  
**Priority:** Low  

---

## Overview

Generate audio narration for chapter content using a Text-to-Speech (TTS) API, allowing readers to listen to chapters in Tamil.

## Recommended Service

**Google Cloud Text-to-Speech**
- Best Tamil language support (`ta-IN` locale)
- Pricing: ~$4 per 1M characters
- [Google Cloud TTS Docs](https://cloud.google.com/text-to-speech)

### Alternatives Considered

| Service | Tamil Support | Cost |
|---|---|---|
| AWS Polly | Yes | ~$4/1M chars |
| ElevenLabs | Limited | $5–$22/mo |
| OpenAI TTS | No | $15/1M chars |

---

## What's Needed

### Infrastructure
- Google Cloud project with TTS API enabled + billing
- `GOOGLE_TTS_API_KEY` server-side environment variable
- Cloudinary (already in use) for storing generated `.mp3` files

### Firestore
- Add `audioUrl?: string` field to `Chapter` type in `src/types/index.ts`

### Backend
- New API route: `POST /api/admin/books/[bookId]/chapters/[chapterId]/audio`
  - Strip HTML from chapter content (use `html-to-text` or similar)
  - Send plain text to Google TTS with `ta-IN` language code
  - Upload returned MP3 to Cloudinary
  - Save `audioUrl` to chapter Firestore document

### Admin UI
- "Generate Audio" button per chapter in the chapter editor
- Show current audio status (generated / not generated)
- Option to regenerate or delete audio

### Reader UI
- Audio player component in chapter reader (`src/components/reader/`)
- Only shown if `audioUrl` exists on the chapter

---

## Flow

```
Admin clicks "Generate Audio"
  → Strip HTML tags from chapter.content
  → POST to Google TTS API (language: ta-IN)
  → Upload MP3 to Cloudinary
  → Save audioUrl to Firestore chapter document
  → Reader displays audio player if audioUrl present
```

---

## Notes

- Chapter content is Tiptap HTML — must strip tags before sending to TTS
- Audio generation can be slow for long chapters; consider background job or streaming
- Storage cost on Cloudinary for MP3s should be estimated before release
- Consider per-chapter regeneration when content is updated
