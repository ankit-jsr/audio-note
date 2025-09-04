import { Home, Headphones, FileText, Bookmark, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { id: "dashboard", name: "Dashboard", icon: Home },
  { id: "library", name: "Audio Library", icon: Headphones },
  { id: "transcripts", name: "Transcripts", icon: FileText },
  { id: "highlights", name: "Highlights", icon: Bookmark },
  { id: "analytics", name: "Analytics", icon: BarChart3 },
  { id: "settings", name: "Settings", icon: Settings },
];

export function Sidebar({ activeTab, onTabChange, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full pt-16 lg:pt-0">
          <nav className="flex-1 px-4 py-6 space-y-2" data-testid="sidebar-nav">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-primary/10 text-primary border-r-2 border-primary"
                  )}
                  onClick={() => {
                    onTabChange(item.id);
                    onClose();
                  }}
                  data-testid={`button-nav-${item.id}`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.name}
                </Button>
              );
            })}
          </nav>

          {/* Storage Usage */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700" data-testid="storage-usage">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Storage Used</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: "65%" }} />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              6.5 GB of 10 GB used
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
