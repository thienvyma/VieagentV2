"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Agent } from "@/types/agent";
import { AgentCard } from "./agent-card";
import { AgentSearch } from "./agent-search";
import { AgentFilters, FilterState } from "./agent-filters";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/core/ui/select";
import { ArrowUpDown, SearchX } from "lucide-react";
import { Button } from "@/components/core/ui/button";

interface AgentMarketplaceClientProps {
    agents: Agent[];
    emptyMessage?: string;
    emptySubMessage?: string;
    userId?: string;
}

type SortOption = "newest" | "price_asc" | "price_desc" | "popular";

export function AgentMarketplaceClient({
    agents,
    emptyMessage = "No agents match your criteria",
    emptySubMessage = "Try adjusting your filters or search terms"
}: AgentMarketplaceClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState<SortOption>("newest");
    const [filters, setFilters] = useState<FilterState>({
        category: "all",
        price: "all",
        complexity: "all"
    });

    // Filter AND Sort agents
    const processedAgents = useMemo(() => {
        const result = agents.filter((agent) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    agent.name.toLowerCase().includes(query) ||
                    agent.description.toLowerCase().includes(query) ||
                    (agent.category?.toLowerCase().includes(query));

                if (!matchesSearch) return false;
            }

            // Category filter
            if (filters.category !== "all") {
                if (agent.category?.toLowerCase() !== filters.category.toLowerCase()) {
                    return false;
                }
            }

            // Price filter
            if (filters.price !== "all") {
                if (filters.price === "free" && agent.price > 0) return false;
                if (filters.price === "paid" && agent.price === 0) return false;
            }

            // Complexity filter
            if (filters.complexity !== "all") {
                if (agent.complexity !== filters.complexity) return false;
            }

            return true;
        });

        // Sorting
        result.sort((a, b) => {
            switch (sortOption) {
                case "newest":
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case "price_asc":
                    return a.price - b.price;
                case "price_desc":
                    return b.price - a.price;
                case "popular":
                    // Fallback to reviews or rating if available, else date
                    return (b.review_count || 0) - (a.review_count || 0);
                default:
                    return 0;
            }
        });

        return result;
    }, [agents, searchQuery, filters, sortOption]);

    const clearAll = () => {
        setSearchQuery("");
        setFilters({ category: "all", price: "all", complexity: "all" });
        setSortOption("newest");
    };

    return (
        <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Filters (Desktop Sticky) */}
            <aside className="lg:col-span-1 space-y-6">
                <div className="lg:sticky lg:top-24 space-y-6">
                    {/* Mobile Search */}
                    <div className="lg:hidden">
                        <AgentSearch
                            onSearch={setSearchQuery}
                            placeholder="Search agents..."
                        />
                    </div>

                    <AgentFilters
                        onFilterChange={setFilters}
                        initialFilters={filters}
                    />
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3 space-y-6">
                {/* Desktop Toolbar: Search + Sort */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-background/50 backdrop-blur-sm p-2 rounded-xl border border-muted/20 sticky top-20 z-30 lg:static lg:bg-transparent lg:border-none lg:p-0">
                    <div className="w-full sm:max-w-md hidden lg:block">
                        <AgentSearch
                            onSearch={setSearchQuery}
                            placeholder="Find an AI agent..."
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline-block">
                            Sort by:
                        </span>
                        <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                            <SelectTrigger className="w-full sm:w-[180px] bg-background">
                                <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest Arrivals</SelectItem>
                                <SelectItem value="popular">Most Popular</SelectItem>
                                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                    <p>
                        Showing <span className="font-medium text-foreground">{processedAgents.length}</span> results
                    </p>
                    {(searchQuery || filters.category !== "all" || filters.price !== "all") && (
                        <Button variant="link" size="sm" onClick={clearAll} className="h-auto p-0 text-primary">
                            Clear filters
                        </Button>
                    )}
                </div>

                {/* Agent Grid */}
                {processedAgents.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-24 text-center space-y-6 bg-muted/10 rounded-2xl border border-dashed border-muted-foreground/20"
                    >
                        <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center">
                            <SearchX className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="max-w-md space-y-2">
                            <h3 className="text-xl font-bold">{emptyMessage}</h3>
                            <p className="text-muted-foreground">{emptySubMessage}</p>
                        </div>
                        <Button onClick={clearAll} variant="outline">
                            Clear all filters
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.05 }
                            }
                        }}
                        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                    >
                        <AnimatePresence>
                            {processedAgents.map((agent) => (
                                <motion.div
                                    layout
                                    key={agent.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                >
                                    <AgentCard agent={agent} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
