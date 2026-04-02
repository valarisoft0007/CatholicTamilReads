# Catholic Reads — Infrastructure Discussion Summary

> Date: 2026-04-01

---

## 1. Cloudinary → Google Drive Migration

**Decision: Stayed with Cloudinary**

Google Drive is not suitable for web app file serving:
- Not a CDN — slow and unreliable for embedding in web pages
- Public sharing links break and are policy-restricted by Google
- No image transformations (resize, compress, format auto)
- Complex OAuth token management for signed/expiring URLs
- Not designed for programmatic file serving in web apps

**Cloudinary Free Tier:**
- 25 GB storage + 25 GB bandwidth/month — free
- Image transformations included
- Already fully integrated into the project

---

## 2. Cloudinary Capacity

| Assumption | Value |
|------------|-------|
| Images per book | 50 (1 cover + 49 chapter images) |
| Avg image size | ~250–300 KB |
| Storage per book | ~12.5 MB |

| Scenario | Storage per book | Books on 25 GB free tier |
|----------|-----------------|--------------------------|
| Images only | ~12.5 MB | ~2,000 books |
| Images + PDF export | ~17 MB | ~1,470 books |
| Images + PDF + EPUB | ~20 MB | ~1,250 books |

---

## 3. Firestore Capacity

### Free Tier (Spark Plan)

| Resource | Free limit |
|----------|-----------|
| Storage | 1 GB |
| Reads | 50,000/day |
| Writes | 20,000/day |
| Deletes | 20,000/day |

### Books that fit in 1 GB

Firestore stores only text/metadata — images and files live in Cloudinary.

| Chapter size (avg) | Books in 1 GB |
|--------------------|--------------|
| Light (~10 KB/chapter) | ~5,000 books |
| Medium (~30 KB/chapter) | ~1,600 books |
| Heavy (~80 KB/chapter) | ~600 books |

### Daily active users on free reads (50K/day)

| User behavior | Reads per session | Free tier capacity |
|--------------|-------------------|-------------------|
| Browse homepage only | ~10 | ~5,000 users/day |
| Read 1 book detail | ~25 | ~2,000 users/day |
| Read 3 chapters | ~40 | ~1,250 users/day |
| Active reader (5 chapters) | ~60 | ~833 users/day |

**Practical free ceiling: ~500–800 active daily readers**

---

## 4. Monthly Cost Estimates (Current Stack)

| Monthly active users | Estimated monthly cost |
|---------------------|----------------------|
| Up to ~500 daily active | **$0** |
| ~1,000 daily active | ~$5–$20 |
| ~5,000 daily active | ~$25–$50 |
| ~10,000 daily active | ~$50–$200 |
| ~50,000 daily active | ~$200/month |
| ~100,000 daily active | ~$400/month |

Firebase Auth free tier supports **50,000 monthly active users** before any cost.

---

## 5. Alternative Options Considered

### Cloudflare R2

Object storage by Cloudflare — direct S3 competitor with **zero egress (download) fees**.

| | AWS S3 | Google Cloud Storage | Cloudflare R2 |
|--|--------|---------------------|---------------|
| Storage cost | $0.023/GB | $0.020/GB | $0.015/GB |
| Egress (downloads) | $0.09/GB | $0.12/GB | **$0** |
| Free storage | 5 GB | — | **10 GB** |
| Free egress | 1 GB/month | — | **Unlimited** |

**Limitation:** No image transformations (would need Cloudflare Images at $5/month).  
**Verdict:** Worth considering at 5,000+ daily users. Not worth migrating now.

---

### Supabase

Full-stack open-source alternative to Firebase (PostgreSQL database + auth + storage).

| Feature | Firebase (Blaze) | Supabase (Free) |
|---------|-----------------|-----------------|
| Database reads | $0.06/100K | **Unlimited** |
| Storage | $0.026/GB | 1 GB free |
| Auth | Free | Free |
| Database | NoSQL (Firestore) | PostgreSQL (SQL) |

**Supabase Storage Free Tier:** Only 1 GB — worse than Cloudinary's 25 GB.

| Supabase Plan | Price | Storage | Bandwidth |
|--------------|-------|---------|-----------|
| Free | $0 | 1 GB | 2 GB/month |
| Pro | $25/month | 100 GB | 200 GB/month |

**Verdict:** Better query performance and cheaper at scale, but major migration effort (~2–3 weeks). Not justified at current stage.

---

### SWR Caching (Best Immediate Win)

Already installed in the project but underutilized. Proper caching could reduce Firestore reads by **60–80%**, effectively multiplying the free tier capacity.

| Fix | Effort | Impact |
|-----|--------|--------|
| SWR caching (already installed) | Low | 60–80% fewer reads |
| Next.js ISR page caching | Low | Near-instant page loads |
| Migrate to Supabase | High | Better query flexibility |
| Switch to Cloudflare R2 | Medium | Marginal storage cost saving |

---

## 6. Performance Comparison

### Database Read Speed

| | Firebase Firestore | Supabase (PostgreSQL) |
|--|-------------------|----------------------|
| Simple reads | ~50–150ms | ~20–80ms |
| Complex queries | Limited, slower | Faster (SQL indexes) |
| Real-time updates | Built-in | Via websockets |

### Image/File Delivery Speed

| | Cloudinary | Cloudflare R2 | Supabase Storage |
|--|-----------|---------------|-----------------|
| CDN nodes | ~200+ globally | ~300+ globally | Via Cloudflare |
| Image optimization | Auto (WebP, resize) | None built-in | None built-in |
| Avg delivery time | ~80–120ms | ~50–80ms | ~60–100ms |

---

## 7. Overall Recommendation

| Stage | Users | Recommendation |
|-------|-------|---------------|
| Now | < 500 daily | **Stay with current stack — it's free** |
| Growing | 500–5,000 daily | **Add SWR caching first** |
| Scaling | 5,000+ daily | **Consider Cloudflare R2 for storage** |
| Large scale | 50,000+ daily | **Evaluate Supabase migration** |

**Current stack (Firebase + Cloudinary) is solid for the current stage.**  
The biggest untapped lever is **SWR caching** — zero vendor changes, high impact.

---

*Generated from infrastructure discussion — Catholic Reads Trail 5 project*
