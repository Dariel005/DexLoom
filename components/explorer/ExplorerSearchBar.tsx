"use client";

import { type ReactNode } from "react";

interface ExplorerSearchBarProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    onClear?: () => void;
    placeholder?: string;
    /** Extra elements to render inline after the search field. */
    trailing?: ReactNode;
}

/**
 * Shared search input styled as the GBA search-deck field with LED +
 * pokéball decorations. Used across all Explorer views.
 */
export function ExplorerSearchBar({
    id,
    value,
    onChange,
    onClear,
    placeholder = "Search...",
    trailing
}: ExplorerSearchBarProps) {
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor={id} className="search-deck-field w-full sm:flex-1">
                <span className="search-deck-led" aria-hidden />
                <span className="search-deck-ball" aria-hidden />
                <input
                    id={id}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-gramm="false"
                    placeholder={placeholder}
                    className="search-deck-input"
                />
                {value.trim().length > 0 ? (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onClear?.();
                        }}
                        className="search-deck-clear-btn"
                        aria-label="Clear search"
                    >
                        x
                    </button>
                ) : null}
                <span className="search-deck-gloss" aria-hidden />
            </label>
            {trailing}
        </div>
    );
}
