"use client";

import dynamicImport from "next/dynamic";
// Wrapper component to handle dynamic loading on client side
const DashboardHeaderDynamic = dynamicImport(
    () => import("./dashboard-header").then((mod) => mod.DashboardHeader),
    { ssr: false }
);

export function DashboardHeaderWrapper() {
    return <DashboardHeaderDynamic />;
}
