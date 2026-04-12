import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

const files = [
  { name: "HiOutz Investor Paper", file: "/HiOutz_Investor_Paper.pdf", type: "PDF" },
  { name: "HiOutz Pitch Deck", file: "/HiOutz_Pitch_Deck.pptx", type: "PPTX" },
];

const Downloads = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (file: string, name: string, type: string) => {
    try {
      setDownloading(file);
      const response = await fetch(file);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name}.${type.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Downloads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {files.map((f) => (
            <Button
              key={f.file}
              variant="outline"
              className="w-full justify-between"
              disabled={downloading === f.file}
              onClick={() => handleDownload(f.file, f.name, f.type)}
            >
              <span>{downloading === f.file ? 'Lädt...' : f.name}</span>
              <span className="text-xs text-muted-foreground">{f.type}</span>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Downloads;
