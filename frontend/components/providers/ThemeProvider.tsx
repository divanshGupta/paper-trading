"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import React from 'react'; // Need React for ComponentProps

// Use ComponentProps to infer all props from the NextThemesProvider component
type WrapperProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({
    children,
    ...props
}: WrapperProps) { // Use the inferred type here

    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            {...props}
        >
            {children}
        </NextThemesProvider>
    )
}