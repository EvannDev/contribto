export default function Home() {
  const githubAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}` +
    `&scope=read:user,public_repo`

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          HelloCommit
        </h1>
        <p className="max-w-sm text-lg text-zinc-600 dark:text-zinc-400">
          Find Good First Issues from your starred GitHub repos.
        </p>
        <a
          href={githubAuthUrl}
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Sign in with GitHub
        </a>
      </div>
    </main>
  )
}
