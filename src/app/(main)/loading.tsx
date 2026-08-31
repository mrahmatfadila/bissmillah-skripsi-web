export default function DashboardLoading() {
    return (
        <div className="w-full h-full p-4 md:p-6 space-y-6 animate-pulse">
            {/* Top Stat Bar Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-28 rounded-xl bg-muted/60 border border-border/50" />
                ))}
            </div>

            {/* Content Area Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-96 rounded-xl bg-muted/50 border border-border/50" />
                <div className="h-96 rounded-xl bg-muted/40 border border-border/50" />
            </div>

            {/* Table/List Skeleton */}
            <div className="h-64 rounded-xl bg-muted/30 border border-border/50" />
        </div>
    );
}
