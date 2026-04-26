# CSEDU Students' Club - Frontend

Modern Next.js frontend for the CSEDU Students' Club Management System.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Lucide React (icons)

## Design Philosophy

This frontend features a distinctive academic/tech aesthetic inspired by IDE and terminal themes:

- **Typography**: Syne (headings) + JetBrains Mono (body/code)
- **Color Palette**: Dark theme with neon accents (green, blue, red, yellow)
- **Layout**: Boxy, non-rounded components for a technical feel
- **Animations**: Staggered slide-up reveals on page load
- **Backgrounds**: Grid patterns and gradient meshes for depth

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### Docker

```bash
docker build -t csedu-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE_URL=http://localhost:4000 csedu-frontend
```

## Features

- **Authentication**: Login, register, JWT-based auth
- **Dashboard**: Overview of events, elections, notices
- **Elections**: View elections, vote for candidates, see results
- **Events**: Browse events, register for events
- **Notices**: View important announcements

## Project Structure

```
frontend/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Dashboard page
│   ├── elections/         # Elections pages
│   ├── events/            # Events pages
│   ├── notices/           # Notices page
│   ├── login/             # Login page
│   ├── register/          # Register page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── Header.tsx         # Navigation header
│   └── ProtectedRoute.tsx # Auth guard
├── lib/                   # Utilities
│   ├── api/              # API client & services
│   └── hooks/            # React hooks (useAuth)
└── public/               # Static assets
```

## API Integration

The frontend communicates with the API Gateway at `http://localhost:4000`. All API calls are handled through the `apiClient` in `lib/api/client.ts`.

### Authentication Flow

1. User logs in via `/login`
2. JWT token stored in localStorage
3. Token sent in Authorization header for protected routes
4. Auto-redirect to login on 401 responses

## Customization

### Colors

Edit CSS variables in `app/globals.css`:

```css
:root {
  --accent-primary: 0 255 170;  /* Neon green */
  --accent-secondary: 255 100 100;  /* Red */
  --accent-tertiary: 100 150 255;  /* Blue */
}
```

### Fonts

Change fonts in `app/globals.css` and `tailwind.config.ts`.

## License

Academic project for CSEDU Students' Club
