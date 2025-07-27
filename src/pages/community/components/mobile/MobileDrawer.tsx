// MobileDrawer.tsx
// Placeholder for MobileDrawer component

import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import MobileCommunityNav from "./MobileCommunityNav";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface MobileDrawerProps {
  children?: React.ReactNode;
}

export default function MobileDrawer({ children }: MobileDrawerProps) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        {children ? (
          children
        ) : (
          <Button variant="outline" size="icon">
            <Menu className="h-4 w-4" />
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Communities</DrawerTitle>
        </DrawerHeader>
        <MobileCommunityNav />
      </DrawerContent>
    </Drawer>
  );
} 