import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const files = [
  { name: "HiOutz Investor Paper", file: "/HiOutz_Investor_Paper.pdf", type: "PDF" },
  { name: "HiOutz Pitch Deck", file: "/HiOutz_Pitch_Deck.pptx", type: "PPTX" },
];

const Downloads = () => {
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
              onClick={() => {
                const link = document.createElement('a');
                link.href = f.file;
                link.download = f.name + '.' + f.type.toLowerCase();
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <span>{f.name}</span>
              <span className="text-xs text-muted-foreground">{f.type}</span>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Downloads;
