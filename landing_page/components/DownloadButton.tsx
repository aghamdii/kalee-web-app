'use client';

import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface DownloadButtonProps {
  children: React.ReactNode;
  isRTL?: boolean;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export default function DownloadButton({ 
  children, 
  isRTL = false, 
  className = "bg-kalee-primary hover:bg-kalee-primary/90 text-white",
  size = "lg"
}: DownloadButtonProps) {
  const handleClick = () => {
    // Simply redirect to download endpoint
    window.open('/download', '_blank');
  };

  return (
    <Button 
      size={size} 
      className={className}
      onClick={handleClick}
    >
      {children}
      <ChevronRight className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
    </Button>
  );
}