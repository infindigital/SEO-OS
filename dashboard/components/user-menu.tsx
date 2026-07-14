"use client";

import { ChevronDown, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProfileView } from "@backend/application/auth/dto";

import { signOutAction } from "@/app/(auth)/actions";
import { RoleBadge } from "./role-badge";

export function UserMenu({ profile }: { profile: ProfileView }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <span className="max-w-[12rem] truncate">{profile.email}</span>
          <ChevronDown className="text-muted-foreground size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col gap-1.5 px-2 py-1.5">
          <span className="truncate text-sm font-medium">{profile.email}</span>
          <span>
            <RoleBadge role={profile.role} />
          </span>
        </div>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <button
            type="submit"
            className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
