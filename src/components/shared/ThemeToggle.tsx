import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ThemeToggle = ({ mobile = false }: { mobile?: boolean }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size={mobile ? "default" : "icon"}
      onClick={toggleTheme}
      className={mobile ? "w-full justify-start" : ""}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-4 h-4" />
          {mobile && <span className="ml-2">Light Mode</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4" />
          {mobile && <span className="ml-2">Dark Mode</span>}
        </>
      )}
    </Button>
  );
};
