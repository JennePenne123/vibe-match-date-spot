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
            <a key={f.file} href={f.file} download className="block">
              <Button variant="outline" className="w-full justify-between">
                <span>{f.name}</span>
                <span className="text-xs text-muted-foreground">{f.type}</span>
              </Button>
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Downloads;
