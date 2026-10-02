import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-24 text-center">
      <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
        Turn your notes into practice exams
      </h1>
      <p className="mt-4 max-w-md text-zinc-600">
        Upload a PDF, Word doc, photo or pasted text. Get a clear summary, then test yourself at
        the difficulty you choose.
      </p>
      <Link
        href={signedIn ? "/dashboard" : "/login"}
        className="mt-8 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
      >
        {signedIn ? "Go to dashboard" : "Get started"}
      </Link>
    </main>
  );
}
