# Next.js Setup

This package uses browser-only APIs and requires client-side rendering. Use dynamic import with `ssr: false`.

## App Router (Next.js 13+)

### Step 1: Create a Client Component Wrapper

Create a client component wrapper for the FeedbackProvider:

```tsx
// app/providers/FeedbackProviderClient.tsx
'use client';

import dynamic from 'next/dynamic';

const FeedbackProvider = dynamic(
  () => import('react-visual-feedback').then((mod) => mod.FeedbackProvider),
  { ssr: false }
);

export default function FeedbackProviderClient({
  children,
  ...props
}: {
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <FeedbackProvider {...props}>
      {children}
    </FeedbackProvider>
  );
}
```

### Step 2: Use in Your Layout

```tsx
// app/layout.tsx
import FeedbackProviderClient from './providers/FeedbackProviderClient';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <FeedbackProviderClient
          onSubmit={async (data) => {
            await fetch('/api/feedback', {
              method: 'POST',
              body: JSON.stringify(data)
            });
          }}
          dashboard={true}
          mode="light"
        >
          {children}
        </FeedbackProviderClient>
      </body>
    </html>
  );
}
```

## Pages Router (Next.js 12 and below)

### Using _app.tsx

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';

const FeedbackProvider = dynamic(
  () => import('react-visual-feedback').then((mod) => mod.FeedbackProvider),
  { ssr: false }
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <FeedbackProvider
      onSubmit={async (data) => {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }}
      dashboard={true}
      mode="light"
    >
      <Component {...pageProps} />
    </FeedbackProvider>
  );
}
```

## API Route Example

Create an API route to handle feedback submissions:

```typescript
// app/api/feedback/route.ts (App Router)
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const data = await request.json();
  
  // Process the feedback
  console.log('Feedback received:', data);
  
  // Save to database, send to email, etc.
  
  return NextResponse.json({ success: true });
}
```

Or for Pages Router:

```typescript
// pages/api/feedback.ts (Pages Router)
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const data = req.body;
  
  // Process the feedback
  console.log('Feedback received:', data);
  
  // Save to database, send to email, etc.
  
  res.status(200).json({ success: true });
}
```

## Common Issues

### Hydration Errors

If you encounter hydration errors, make sure you're using `ssr: false` in the dynamic import.

### Window is not defined

This error occurs when the component tries to access `window` during server-side rendering. The dynamic import with `ssr: false` should prevent this.

### TypeScript Errors

If you get TypeScript errors, make sure to install type definitions:

```bash
npm install --save-dev @types/react @types/react-dom
```

## Next Steps

- Configure [integrations](../integrations/) with Jira or Google Sheets
- Customize the [dashboard](../features/dashboard.md)
- Learn about [data structures](../api/data-structures.md)
