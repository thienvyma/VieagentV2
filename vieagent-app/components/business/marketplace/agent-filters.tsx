"use client";

import { useState } from "react";
import { Badge } from "@/components/core/ui/badge";
import { Button } from "@/components/core/ui/button";
import { Separator } from "@/components/core/ui/separator";
import {
    Bot,
    Database,
    FileText,
    MessageSquare,
    Search as SearchIcon,
    TrendingUp,
    Zap,
    Filter,
    X
} from "lucide-react";

// Category definitions with icons
const CATEGORIES = [
    { id: "all", label: "All", icon: Zap },
    { id: "chatbot", label: "Chatbot", icon: MessageSquare },
    { id: "content", label: "Content", icon: FileText },
    { id: "data", label: "Data", icon: Database },
    { id: "seo", label: "SEO", icon: TrendingUp },
    { id: "research", label: "Research", icon: SearchIcon },
    { id: "automation", label: "Automation", icon: Bot },
];

const PRICE_FILTERS = [
    { id: "all", label: "All Prices" },
    { id: "free", label: "Free" },
    { id: "paid", label: "Paid" },
];

const COMPLEXITY_FILTERS = [
    { id: "all", label: "All Levels" },
    { id: "beginner", label: "Beginner" },
    { id: "intermediate", label: "Intermediate" },
    { id: "advanced", label: "Advanced" },
];

export interface FilterState {
    category: string;
    price: string;
    complexity: string;
}

interface FilterContentProps {
    filters: FilterState;
    updateFilter: (key: keyof FilterState, value: string) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;
}

function FilterContent({ filters, updateFilter, clearFilters, hasActiveFilters }: FilterContentProps) {
    return (
        <div className="space-y-6">
            {/* Categories */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = filters.category === cat.id;
                        return (
                            <Badge
                                key={cat.id}
                                variant={isActive ? "default" : "outline"}
                                className={`cursor-pointer transition-colors ${isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted"
                                    }`}
                                onClick={() => updateFilter("category", cat.id)}
                            >
                                <Icon className="h-3 w-3 mr-1" />
                                {cat.label}
                            </Badge>
                        );
                    })}
                </div>
            </div>

            <Separator />

            {/* Price */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                <div className="flex flex-wrap gap-2">
                    {PRICE_FILTERS.map((price) => (
                        <Badge
                            key={price.id}
                            variant={filters.price === price.id ? "default" : "outline"}
                            className={`cursor-pointer transition-colors ${filters.price === price.id
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                                }`}
                            onClick={() => updateFilter("price", price.id)}
                        >
                            {price.label}
                        </Badge>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Complexity */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Complexity</h3>
                <div className="flex flex-wrap gap-2">
                    {COMPLEXITY_FILTERS.map((level) => (
                        <Badge
                            key={level.id}
                            variant={filters.complexity === level.id ? "default" : "outline"}
                            className={`cursor-pointer transition-colors ${filters.complexity === level.id
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                                }`}
                            onClick={() => updateFilter("complexity", level.id)}
                        >
                            {level.label}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
                <>
                    <Separator />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="w-full"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Clear all filters
                    </Button>
                </>
            )}
        </div>
    );
}

interface AgentFiltersProps {
    onFilterChange: (filters: FilterState) => void;
    initialFilters?: FilterState;
}

export function AgentFilters({ onFilterChange, initialFilters }: AgentFiltersProps) {
    const [filters, setFilters] = useState<FilterState>(
        initialFilters || { category: "all", price: "all", complexity: "all" }
    );
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const updateFilter = (key: keyof FilterState, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const defaultFilters = { category: "all", price: "all", complexity: "all" };
        setFilters(defaultFilters);
        onFilterChange(defaultFilters);
    };

    const hasActiveFilters = filters.category !== "all" || filters.price !== "all" || filters.complexity !== "all";

    return (
        <>
            {/* Desktop Filters */}
            <div className="hidden md:block">
                <div className="bg-card border rounded-xl shadow-sm p-6 sticky top-24">
                    <div className="flex items-center gap-2 mb-6">
                        <Filter className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold text-lg">Filters</h2>
                    </div>
                    <FilterContent
                        filters={filters}
                        updateFilter={updateFilter}
                        clearFilters={clearFilters}
                        hasActiveFilters={hasActiveFilters}
                    />
                </div>
            </div>

            {/* Mobile Toggle Button */}
            <div className="md:hidden">
                <Button
                    variant="outline"
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="w-full"
                >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2">
                            {[filters.category, filters.price, filters.complexity]
                                .filter(f => f !== "all").length}
                        </Badge>
                    )}
                </Button>

                {/* Mobile Filters Dropdown */}
                {showMobileFilters && (
                    <div className="mt-4 p-4 border rounded-lg bg-background">
                        <FilterContent
                            filters={filters}
                            updateFilter={updateFilter}
                            clearFilters={clearFilters}
                            hasActiveFilters={hasActiveFilters}
                        />
                    </div>
                )}
            </div>
        </>
    );
}

