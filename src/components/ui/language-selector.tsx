import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LanguageCode } from '@/context/TranslationContext';

interface Language {
  code: 'en' | 'hi';
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
];

interface LanguageSelectorProps {
  selectedLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  className
}) => {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {languages.map((language) => (
        <Button
          key={language.code}
          variant={selectedLanguage === language.code ? "default" : "outline"}
          size="lg"
          onClick={() => onLanguageChange(language.code)}
          className={cn(
            "h-button flex flex-col items-center justify-center space-y-1 border-2 py-5",
            selectedLanguage === language.code 
              ? "bg-primary border-primary text-primary-foreground shadow-medium" 
              : "bg-card border-card-border hover:border-primary/50 hover:bg-accent"
          )}
        >
          {/* <span className="font-medium text-sm">{language.name}</span> */}
          <span className="text-lg font-devanagari">{language.nativeName}</span>
        </Button>
      ))}
    </div>
  );
};