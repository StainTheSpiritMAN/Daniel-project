# Editing the Suburban website — staff guide

Everything on the website can be changed from the dashboard at
**`https://<your-site>/admin`**. You never need a developer to update text,
photos, projects, the team, or contact details.

## Signing in

1. Go to `/admin` and sign in with the email and password an administrator gave you.
2. Change your password straight away: **My account → Change password**.
3. Forgot your password? Ask an administrator to reset it under **Users**.

After 5 quick login attempts you must wait a minute. After 10 wrong passwords
from the same network, that network must wait an hour before trying that email
again — you can still sign in from another connection (e.g. mobile data).

## Where things are

| I want to change… | Go to |
| --- | --- |
| Phone numbers, emails, address, tagline | Pages & settings → **Company details** |
| Homepage headline, buttons, the numbers, the background video | Pages & settings → **Homepage hero** |
| "Who we are", "Why choose us" photo, section headings | Pages & settings → **Homepage sections** |
| Mission and vision | Pages & settings → **Mission & vision** |
| About page text and photo | Pages & settings → **About page** |
| CEO message | Pages & settings → **CEO statement** |
| The dark "Ready to power your next project?" banner | Pages & settings → **Call-to-action banner** |
| A service (title, bullets, photo) | Content → **Services** |
| The project list | Content → **Projects** |
| "Our work in pictures" | Content → **Gallery** |
| Client logos | Content → **Clients** |
| Management team | Content → **Team** |
| Core values / Why choose us points | Content → **Core values** / **Why choose us** |
| Contact-form messages and newsletter sign-ups | **Inbox** |

## Publishing

- **Live** items are on the website. **Draft** items are saved but hidden.
- **Save & publish** makes a change visible within a few seconds. Refresh the
  website to check it (use **View website ↗**).
- To hide something without deleting it, press **Unpublish**.
- To change the order things appear in, drag rows in a list (or use ▲ ▼).
- Settings pages have no draft step: **Save & publish** goes live immediately.
- If you leave a page with unsaved changes, the browser will warn you.

## Formatting text

Long text boxes (paragraphs, biographies, summaries…) have a small toolbar:

- **B** bold, *I* italic — select words first, or press Ctrl/⌘+B / Ctrl/⌘+I.
- **Link** — select the words, click Link, and paste the address
  (`https://…`, a page like `/contact`, or `mailto:name@example.com`).
- **• List / 1. List** — turns the selected lines into a bulleted or numbered list.
- **Preview** shows how it will look. You may see symbols such as `**` in the
  box itself — that is how the formatting is stored; the website shows it properly.

Headings, fonts and sizes are set by the design and can't be changed here.

## Appearance (administrators)

Under **Pages & settings → Appearance**:

- **Colours & theme** — choose a ready-made theme or "Custom colours". The preview
  shows buttons and text in the new colours; a ⚠ warning means some text may be
  hard to read, so try a deeper or brighter shade.
- **Logo & site icon** — upload your logo (a wide PNG with a transparent
  background), an optional white version for the dark footer, and a square icon
  (512 × 512 px) for browser tabs and phone home screens. Leave empty to keep the
  original "S SUBURBAN" lettermark.
- **Page layout & backgrounds** — for the Homepage, About, Services and Projects
  pages: tick/untick to show or hide a section, drag (or ▲ ▼) to reorder, pick a
  background (white, light grey, dark, brand colour), and where offered choose the
  photo side or number of columns. "Reset this page" restores the original layout.
- **Banner photos** — the About, Services, Projects and Contact page settings each
  have an optional banner photo and a **darkness** slider; the homepage hero has a
  **video darkness** slider. Darker = easier-to-read text.

## Photos

- Upload in **Media library**, or straight from any photo field (**Choose image… → Upload**).
- JPG, PNG or WebP, up to 15 MB. Photos are resized and compressed automatically, so
  upload the best quality you have.
- Every photo needs a short **description** (alt text), e.g. *"Engineers installing
  rooftop solar panels"*. It helps visually-impaired visitors and Google. You will be
  asked for it before a photo can be used.
- Landscape photos work best for services, the gallery and page banners. Use square
  photos for team members and the CEO.
- A photo that is used on the site cannot be deleted. The Media library shows where
  it is used — replace it there first.
- **Client names:** check you have permission before naming a client in a caption or
  project. Otherwise use a general description such as "Private sector client".

## Changing the homepage video

The video must be small, or the homepage becomes slow on mobile data.

- MP4, about 15–30 seconds, 1920 × 1080, **no sound**, ideally under 10 MB (maximum 200 MB).
- To shrink a video, you (or a developer) can use the free tool `ffmpeg`:

  ```bash
  ffmpeg -i original.mov -vf scale=1920:-2 -c:v libx264 -crf 30 -preset slow \
         -an -movflags +faststart hero.mp4
  ```

- Upload it under **Homepage hero → Background video (MP4)**. The WebM version is
  optional. A still frame is taken from the video automatically if you leave
  **Video placeholder image** empty.

## Users and roles (administrators)

- **Editor** — can change and publish all content, upload media and read the inbox.
- **Admin** — everything an editor can do, plus manage users, change SEO settings and
  view the **Activity log** (who changed what, and when).
- Accounts are deactivated, not deleted. Deactivating signs the person out at once.
- There must always be at least one active admin.
