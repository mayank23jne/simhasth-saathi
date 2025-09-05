import React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
  groupCode?: string;
  showNotifications?: boolean;
  onNotificationClick?: () => void;
   className?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  groupCode,
  showNotifications = false,
  onNotificationClick,
  className
}) => {
  return (
    <div className={cn("bg-card/95 backdrop-blur-sm border-b border-card-border shadow-soft", className
      )}
>
      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl-mobile font-bold text-foreground">
              {title}
            </h1>
            {(subtitle || groupCode) && (
              <p className="text-sm text-muted-foreground">
                {subtitle} {groupCode && `Group: ${groupCode}`}
              </p>
            )}
          </div>

          {showNotifications && (
            <Button
              size="sm"
              variant="outline"
              className="relative"
              onClick={onNotificationClick}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-danger rounded-full"></span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );    
};

export default Header;
