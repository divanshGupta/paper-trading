import { useRouter } from "next/router";
import Link from "next/link";
import { NavLinkProps } from "@/types";

export default function NavLink({ href, label }: NavLinkProps) {
  const { pathname } = useRouter();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`px-3 py-2 font-medium transition-colors ${
        active ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-primary"
      }`}
    >
      {label}
    </Link>
  );
}
