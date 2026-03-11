---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

---

## FLL Project Context (First Line Logistics - fll.sa)

### Project Overview
- **Company**: First Line Logistics (فيرست لاين لوجستيكس) - Saudi Arabia
- **Type**: Enterprise logistics operating system for delivery drivers
- **Platforms served**: Jahez, HungerStation, Keeta, Mrsool, Amazon, TheChefz, Wasfaty, Ninja, Toyou
- **Stack**: React 18 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui + Supabase
- **Region**: me-south-1 (Bahrain) AWS
- **Direction**: RTL Arabic-first, with English support

### Existing Design System (src/index.css)
- **Primary font**: Noto Sans Arabic + Plus Jakarta Sans
- **Mono font**: JetBrains Mono (for metrics/KPIs)
- **Brand teal**: `oklch(0.72 0.13 188)` → `#4FB5AB`
- **Dark blue**: `oklch(0.18 0.08 220)` → `#1A3C4D`
- **Accent cyan**: `oklch(0.55 0.15 200)` → `#00C1D4`
- **Tone**: "Industrial Sophistication" — logistics physicality + high-end SaaS
- **Philosophy**: Institutional Excellence, Bento Surfaces, rim-light depth effects

### AWS Integration Points
- **API Gateway**: `https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com`
- **Auth**: AWS Cognito
- **Storage**: S3 (me-south-1)
- **Email**: SES from `no-reply@fll.sa`
- **DB**: Aurora PostgreSQL (finance) + Supabase (ops/HR)
- **Vercel API routes**: `/api/ai-chat`, `/api/send-email`, `/api/employee_registration`

### Key Pages to Enhance
- `src/pages/Home.tsx` — Public landing page
- `src/pages/admin/AdminDashboard.tsx` — Main admin dashboard
- `src/pages/driver/DriverDashboard.tsx` — Driver portal home
- `src/pages/admin/Finance.tsx` — Finance management
- `src/pages/admin/Couriers.tsx` — Courier management
- `src/pages/courier/Portal.tsx` — Courier self-service portal

### Design Rules for This Project
1. RTL-first layout (Arabic primary, `dir="rtl"`)
2. Use existing CSS variables — do NOT introduce new color systems
3. All new components go in `src/components/`
4. Data from AWS API must use auth token from Cognito (stored in localStorage as `fll_token`)
5. Supabase client: import from `@/lib/supabase`
6. Use `lucide-react` for all icons
7. Use `framer-motion` for page-load animations and transitions
8. shadcn/ui components as base — extend with custom CSS for distinctive look
9. Finance metrics must use `JetBrains Mono` font class
10. Never show fake/random data — use loading skeletons while fetching
