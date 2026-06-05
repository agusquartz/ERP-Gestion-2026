import Link from "next/link";

const accountingSections = [
  {
    title: "Chart of Accounts",
    description: "View the accounting account structure.",
    href: "/accounting/chart-of-accounts",
  },
  {
    title: "Journal Entries",
    description: "List, review and manage accounting entries.",
    href: "/accounting/entries",
  },
  {
    title: "New Journal Entry",
    description: "Create a new manual accounting entry.",
    href: "/accounting/entries/new",
  },
  {
    title: "Accounting Closures",
    description: "Manage monthly or yearly accounting period closures.",
    href: "/accounting/closures",
  },
  {
    title: "Entry Models",
    description: "Review automatic accounting entry templates.",
    href: "/accounting/entry-models",
  },
  {
    title: "Accounting Processes",
    description: "View fiscal year accounting configurations.",
    href: "/accounting/processes",
  },
];

export default function Page() {
  return (
    <main className="p-6 space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Accounting</h1>

        <p className="text-muted-foreground">
          Manage accounting processes, chart of accounts, journal entries,
          closures and automatic entry models.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accountingSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground"
          >
            <div className="space-y-2">
              <h2 className="text-lg font-medium">{section.title}</h2>

              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}