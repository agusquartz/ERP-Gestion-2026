import AppLayout from "./AppLayout";
import { whoAmI } from "@/lib/http/server/auth";
import { cookies } from "next/headers";

export default async function Layout({ children }) {
  const cookieStore = await cookies();

  const cookieHeader = cookieStore.toString();
  const csrfToken = cookieStore.get("csrfToken")?.value;

  let data = null;

  try {
    data = await whoAmI(cookieHeader, csrfToken);
  } catch (error) {
    console.error("whoAmI failed:", error);
  } 

  return (
    <AppLayout permissions={data?.permissions || []}>
      {children}
    </AppLayout>
  );
}
