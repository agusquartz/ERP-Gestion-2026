
//   // NOTES
//   /*
//     Buttons:
//       Sales
//         - Nueva Venta
//         - Documentos
//       Purchases
//         - Nuevo Pedido
//         - Pedidos de Compra
//         - Ordenes de Compra
//         - Facturas de Compra
//         - Nuevo Pago
//         - Ordenes de Pago
//         - Notas de Devolucion
//         - Notas de Credito
//       Treasury
//         - Facturas de Compra (mismo boton que el anterior, si tiene permisos de tesoreria, apararece el modulo de compra con esto solamente)
//         - Cheques
//         - Conciliaciones
//         - Depositos
//         - Ordenes de Pago
//         - Nuevo Movimiento
//       HR AND Payroll
//         - Empleados
//         - Proceso de Pago
//         - Novedades
//       Accounting
//         - Procesos Contables
//         - Plan de cuentas
//         - Asientos
//         - Modelos de Asiento
//   */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { logout, whoAmI } from "@/lib/http/client/auth";

function getModulesAccess(permissions = []) {
  const moduleMap = {
    purchases: ["purchases"],
    sales: ["sales"],
    treasury: ["treasury"],
    hr: ["hr", "payroll"],
    accounting: ["accounting"],
  };

  const result = {};

  for (const [module, prefixes] of Object.entries(moduleMap)) {
    result[module] = permissions.some((p) =>
      prefixes.some((prefix) => p.startsWith(prefix + "."))
    );
  }

  return result;
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function isRouteActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const EMPTY_PERMISSIONS = [];

export default function AppLayout({
  children,
  permissions = EMPTY_PERMISSIONS,
}) {
  const router = useRouter();
  const pathname = usePathname();

  const modulesAccess = useMemo(
    () => getModulesAccess(permissions),
    [permissions]
  );


  useEffect(() => {
    let ignore = false;

    async function checkSession() {
      try {
        await whoAmI();
      } catch {
        if (!ignore) {
          router.replace("/");
        }
      }
    }

    checkSession();

    return () => {
      ignore = true;
    };
  }, [router]);

  const modules = useMemo(() => {
    const allModules = [
      {
        key: "sales",
        title: "Sales",
        basePath: "/sales",
        visible: modulesAccess.sales,
        items: [
          {
            label: "Nueva Venta",
            href: "/sales/new",
            permissionPrefix: "sales",
          },
          {
            label: "Documentos",
            href: "/sales/documents",
            permissionPrefix: "sales",
          },
        ],
      },
      {
        key: "purchases",
        title: "Purchases",
        basePath: "/purchases",
        visible: modulesAccess.purchases || modulesAccess.treasury,
        items: [
          {
            label: "Nuevo Pedido",
            href: "/purchases/purchase-requests/new",
            permissionPrefix: "purchases",
          },
          {
            label: "Pedidos de Compra",
            href: "/purchases/purchase-requests",
            permissionPrefix: "purchases",
          },
          {
            label: "Ordenes de Compra",
            href: "/purchases/purchase-orders",
            permissionPrefix: "purchases",
          },
          {
            label: "Facturas de Compra",
            href: "/purchases/purchase-invoices",
            permissionPrefix: ["purchases", "treasury"],
          },
          {
            label: "Nuevo Pago",
            href: "/purchases/new-payment",
            permissionPrefix: "purchases",
          },
          {
            label: "Ordenes de Pago",
            href: "/purchases/payment-orders",
            permissionPrefix: ["purchases", "treasury"],
          },
          {
            label: "Notas de Devolucion",
            href: "/purchases/return-notes",
            permissionPrefix: "purchases",
          },
          {
            label: "Notas de Credito",
            href: "/purchases/supplier-credit-notes",
            permissionPrefix: "purchases",
          },
        ],
      },
      {
        key: "treasury",
        title: "Treasury",
        basePath: "/treasury",
        visible: modulesAccess.treasury,
        items: [
          {
            label: "Cheques",
            href: "/treasury/checks",
            permissionPrefix: "treasury",
          },
          {
            label: "Conciliaciones",
            href: "/treasury/reconciliations",
            permissionPrefix: "treasury",
          },
          {
            label: "Depositos",
            href: "/treasury/deposits",
            permissionPrefix: "treasury",
          },
          {
            label: "Nuevo Movimiento",
            href: "/treasury/new-movement",
            permissionPrefix: "treasury",
          },
        ],
      },
      {
        key: "hr",
        title: "HR & Payroll",
        basePath: "/hr",
        visible: modulesAccess.hr,
        items: [
          {
            label: "Empleados",
            href: "/hr/employees",
            permissionPrefix: ["hr", "payroll"],
          },
          {
            label: "Proceso de Pago",
            href: "/hr/payroll-process",
            permissionPrefix: ["hr", "payroll"],
          },
          {
            label: "Novedades",
            href: "/hr/news",
            permissionPrefix: ["hr", "payroll"],
          },
        ],
      },
      {
        key: "accounting",
        title: "Accounting",
        basePath: "/accounting",
        visible: modulesAccess.accounting,
        items: [
          {
            label: "Procesos Contables",
            href: "/accounting/processes",
            permissionPrefix: "accounting",
          },
          {
            label: "Plan de cuentas",
            href: "/accounting/chart-of-accounts",
            permissionPrefix: "accounting",
          },
          {
            label: "Asientos",
            href: "/accounting/entries",
            permissionPrefix: "accounting",
          },
          {
            label: "Modelos de Asiento",
            href: "/accounting/entry-models",
            permissionPrefix: "accounting",
          },
        ],
      },
    ];

    const hasPermission = (permissionPrefix) => {
      const prefixes = Array.isArray(permissionPrefix)
        ? permissionPrefix
        : [permissionPrefix];

      return permissions.some((p) =>
        prefixes.some((prefix) => p.startsWith(prefix + "."))
      );
    };

    return allModules
      .filter((module) => module.visible)
      .map((module) => ({
        ...module,
        items: module.items.filter((item) => hasPermission(item.permissionPrefix)),
      }))
      .filter((module) => module.items.length > 0);
  }, [modulesAccess, permissions]);

  const [openModules, setOpenModules] = useState({});

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  useEffect(() => {
    const activeModule = modules.find((module) =>
      pathname.startsWith(module.basePath)
    );

    if (!activeModule) return;

    setOpenModules((prev) => {
      if (prev[activeModule.key]) return prev;

      return {
        ...prev,
        [activeModule.key]: true,
      };
    });

    console.log(permissions)
  }, [pathname, modules]);

  const toggleModule = (moduleKey) => {
    setOpenModules((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-[#F8FAFC]">
        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[5px]">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="5" fill="#185BFF" />
              <path
                d="M13 26V19H15V26H13ZM19 26V19H21V26H19ZM10 30V28H30V30H10ZM25 26V19H27V26H25ZM10 17V15L20 10L30 15V17H10Z"
                fill="#F5F7FF"
              />
            </svg>
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Neumaticos Enc sa</span>
            <span className="text-xs text-muted-foreground">
              Venta Minorista
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {modules.map((module) => {
            const moduleActive = pathname.startsWith(module.basePath);
            const isOpen = openModules[module.key];

            return (
              <div key={module.key} className="mb-3">
                <button
                  type="button"
                  onClick={() => toggleModule(module.key)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[11px] font-bold uppercase tracking-widest transition ${
                    moduleActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <span>{module.title}</span>
                  <ChevronIcon open={!!isOpen} />
                </button>

                {isOpen && (
                  <div className="mt-1 space-y-1">
                    {module.items.map((item) => {
                      const active = isRouteActive(pathname, item.href);

                      return (
                        <Link key={item.href} href={item.href}>
                          <div
                            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                              active
                                ? "border-l-[3px] border-primary bg-primary/10 font-medium text-primary"
                                : "text-foreground hover:bg-muted/30"
                            }`}
                          >
                            {item.label}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-destructive/10"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 bg-[#D9D9D9]">
        <div className="min-h-screen h-full p-6">{children}</div>
      </main>
    </div>
  );
}