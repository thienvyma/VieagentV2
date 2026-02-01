"use client";

import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/core/ui/input";
import { Button } from "@/components/core/ui/button";

interface AgentSearchProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

export function AgentSearch({ onSearch, placeholder = "Search agents..." }: AgentSearchProps) {
    const [query, setQuery] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleSearch = (value: string) => {
        setQuery(value);
        startTransition(() => {
            onSearch(value);
        });
    };

    const handleClear = () => {
        setQuery("");
        startTransition(() => {
            onSearch("");
        });
    };

    return (
        <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-10"
            />
            {query && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={handleClear}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
            {isPending && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
