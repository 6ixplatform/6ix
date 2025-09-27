import * as React from "react";
import Link from "next/link";

type Props = React.PropsWithChildren<{
    href: string;
    className?: string;
    title?: string;
}>;

/**
* Opens policy URLs in a separate tab/window so the main app never navigates away.
* Adds rel="noopener noreferrer" for security & performance.
*/
export default function PolicyLink({ href, className, title, children }: Props) {
    return (
        <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            title={title}
            prefetch={false}
        >
            {children}
        </Link>
    );
}
