import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/common/ThemeProvider";
import Button from "@/common/Button";

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            onClick={toggleTheme}
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-lg"
            aria-label="Toggle theme"
        >
            {theme === "light" ? (
                <Moon size={20} className="text-gray-600" />
            ) : (
                <Sun size={20} className="text-yellow-400" />
            )}
        </Button>
    );
};

export default ThemeToggle;
