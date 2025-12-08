import { NextResponse } from 'next/server';


export async function GET() {
   try {
      const res = await fetch('https://api.github.com/repos/devAaus/better-auth', {
         headers: {
            Authorization: process.env.GITHUB_TOKEN ? `Bearer ${process.env.GITHUB_TOKEN}` : '',
            Accept: 'application/vnd.github+json',
         },
         next: { revalidate: 60 },
      });

      if (!res.ok) {
         return NextResponse.json({ error: 'Failed to fetch stars' }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json({ stars: data.stargazers_count });
   } catch (error) {
      return NextResponse.json({ error: error || 'Unexpected error' }, { status: 500 });
   }
}
