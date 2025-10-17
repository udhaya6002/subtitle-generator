import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LANGUAGES, Language } from "@/types/subtitle";

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onLanguageToggle: (code: string) => void;
}

export const LanguageSelector = ({ selectedLanguages, onLanguageToggle }: LanguageSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Select Languages</Label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {LANGUAGES.map((lang) => (
          <div
            key={lang.code}
            className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
            onClick={() => onLanguageToggle(lang.code)}
          >
            <Checkbox
              id={`lang-${lang.code}`}
              checked={selectedLanguages.includes(lang.code)}
              onCheckedChange={() => onLanguageToggle(lang.code)}
            />
            <Label
              htmlFor={`lang-${lang.code}`}
              className="cursor-pointer flex-1 font-normal"
            >
              {lang.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};
