import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', color }) => {
  // Safe dynamic lookup for Lucide icon
  const IconComponent = (Icons as any)[name] || Icons.Tag;
  return <IconComponent className={className} style={color ? { color } : undefined} />;
};
