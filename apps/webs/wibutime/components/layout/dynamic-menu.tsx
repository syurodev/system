"use client";

import {authUtils, useAuth} from "@/lib/utils/better-auth-client";
import {Avatar, AvatarFallback, AvatarImage,} from "@farmatic/ui/components/avatar";
import {Button} from "@farmatic/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@farmatic/ui/components/dropdown-menu";
import {cn} from "@farmatic/ui/lib/utils";
import {Ellipsis, Home, LogIn, LogOut, Settings, User} from "lucide-react";
import LanguageSwitcher from "./language-switcher";
import ThemeSwitcher from "./theme-switcher";

export default function DynamicMenu() {
  const {user, isAuthenticated, isLoading} = useAuth();

  const handleLogout = async () => {
    try {
      await authUtils.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  console.log("Debug auth state:", {
    user,
    isAuthenticated,
    isLoading,
    hasUser: !!user,
  });

  // Get user initials for avatar fallback
  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
      <nav
          className={cn(
              "fixed bottom-7 left-1/2 -translate-x-1/2 flex gap-4 items-center justify-center w-fit max-w-[90%] origin-center border border-border bg-background/30 backdrop-blur-sm rounded-full p-4 shadow-md h-[60px] z-50"
          )}
      >
        <Button
            className={"rounded-2xl bg-background/30 backdrop-blur-md shadow-sm"}
            variant={"outline"}
        >
          <Home className={"size-5"}/>
        </Button>
        <Button
            className={"rounded-2xl bg-background/30 backdrop-blur-md shadow-sm"}
            variant={"outline"}
        >
          <Settings className={"size-5"}/>
        </Button>
        <Button
            className={"rounded-2xl bg-background/30 backdrop-blur-md shadow-sm"}
            variant={"outline"}
        >
          <User className={"size-5"}/>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full">
            {isAuthenticated && !isLoading ? (
                <Avatar className="m-auto">
                  <AvatarImage src=""/>
                  <AvatarFallback>
                    {getUserInitials(user?.name, user?.email)}
                  </AvatarFallback>
                </Avatar>
            ) : (
                <Button
                    className="rounded-2xl bg-background/30 backdrop-blur-md shadow-sm"
                    variant="outline"
                    asChild
                >
                  <Ellipsis className="size-5"/>
                </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>
              {isAuthenticated && !isLoading ? (
                  <span>{user?.name || user?.email}</span>
              ) : (
                  <Button
                      className="rounded-2xl bg-background/30 backdrop-blur-md shadow-sm w-full"
                      variant="outline"
                      onClick={() => (window.location.href = "/auth/login")}
                  >
                    <LogIn/> Login
                  </Button>
              )}
            </DropdownMenuLabel>
            {isAuthenticated && !isLoading && (
                <>
                  <DropdownMenuSeparator/>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4"/>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4"/>
                    Settings
                  </DropdownMenuItem>
                </>
            )}
            <DropdownMenuSeparator/>
            <DropdownMenuItem>
              <ThemeSwitcher/>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LanguageSwitcher/>
            </DropdownMenuItem>
            {isAuthenticated && !isLoading && (
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4"/>
                  Logout
                </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
  );
}
