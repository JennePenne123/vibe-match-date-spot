// Shareholder Report - December 2024 Summary
import { Brain, Store, Gamepad2, Sparkles, MapPin, Bell, Download, Printer, Check, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToPDF, printReport } from "@/utils/pdfExport";
import { toast } from "sonner";

const metrics = [
  { value: "6", label: "Major Features" },
  { value: "5", label: "Edge Functions" },
  { value: "15+", label: "New Components" },
  { value: "3", label: "API Integrations" },
];

const features = [
  {
    icon: Brain,
    title: "AI Learning System",
    color: "from-purple-500 to-indigo-600",
    points: [
      "Adaptive recommendation engine",
      "Personalized preference vectors",
      "AI accuracy tracking & insights",
    ],
  },
  {
    icon: Store,
    title: "Venue Marketplace",
    color: "from-rose-500 to-pink-600",
    points: [
      "Partner dashboard portal",
      "Voucher creation & management",
      "Real-time redemption analytics",
    ],
  },
  {
    icon: Gamepad2,
    title: "Gamification System",
    color: "from-amber-500 to-orange-600",
    points: [
      "Referral program with rewards",
      "4 milestone badge tiers",
      "Points economy integration",
    ],
  },
  {
    icon: Sparkles,
    title: "Premium UX",
    color: "from-cyan-500 to-blue-600",
    points: [
      "Apple-style landing redesign",
      "Glass morphism effects",
      "Micro-interaction animations",
    ],
  },
  {
    icon: MapPin,
    title: "Multi-Source Venues",
    color: "from-emerald-500 to-teal-600",
    points: [
      "Google Places integration",
      "Foursquare API fallback",
      "Intelligent data enrichment",
    ],
  },
  {
    icon: Bell,
    title: "Real-Time Updates",
    color: "from-violet-500 to-purple-600",
    points: [
      "Live invitation notifications",
      "Actionable toast messages",
      "WebSocket event streaming",
    ],
  },
];

const techStack = ["React 18", "TypeScript", "Supabase", "Edge Functions", "Tailwind CSS", "Framer Motion"];

const ShareholderReport = () => {
  const handleDownloadPDF = async () => {
    toast.loading("Generating PDF...");
    await exportToPDF("shareholder-report", "VybePulse-December-2024.pdf");
    toast.dismiss();
    toast.success("PDF downloaded successfully!");
  };

  const handlePrint = () => {
    printReport("shareholder-report");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Export Controls */}
      <div className="flex justify-end gap-3 mb-6 print:hidden" data-hide-in-pdf>
        <Button variant="outline" onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button onClick={handleDownloadPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Report Content */}
      <div
        id="shareholder-report"
        className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ aspectRatio: "297/210" }} // A4 Landscape ratio
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                <Flame className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                  VybePulse
                </h1>
                <p className="text-white/80 text-sm">AI-Powered Date Planning Platform</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
                <p className="text-xs text-white/70 uppercase tracking-wider">Product Update</p>
                <p className="text-xl font-bold">December 2024</p>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-4 border-b border-gray-100">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="text-center py-5 border-r border-gray-100 last:border-r-0"
            >
              <p className="text-4xl font-bold bg-gradient-to-br from-rose-600 to-purple-600 bg-clip-text text-transparent">
                {metric.value}
              </p>
              <p className="text-sm text-gray-500 mt-1">{metric.label}</p>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-4 p-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`bg-gradient-to-br ${feature.color} rounded-lg p-2 text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {feature.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Tech Stack Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider mr-2">Tech Stack:</span>
              {techStack.map((tech, index) => (
                <span
                  key={index}
                  className="bg-white border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-600"
                >
                  {tech}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Confidential • For Shareholder Review Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareholderReport;
