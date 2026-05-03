import NewSalePage from "@/modules/sales/pages/NewSalePage";

export default async function Page({ searchParams }) {
  const params = await searchParams;

  console.log("searchParams en page.js:", params);

  return <NewSalePage quoteId={params?.quote_id ?? null} />;
}