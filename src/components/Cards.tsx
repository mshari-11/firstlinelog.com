import { motion } from "framer-motion";
import { MapPin, ArrowUpLeft } from "lucide-react";
import { 
  MetricData, 
  PlatformData, 
  CityData 
} from "@/lib/index";

const hoverLift = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -8, 
    scale: 1.02, 
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30 
    } 
  }
};

/**
 * بطاقة لعرض المقاييس التشغيلية والإحصائيات الرئيسية
 */
export function MetricCard({ metric }: { metric: MetricData }) {
  return (
    <motion.div
      variants={hoverLift}
      initial="rest"
      whileHover="hover"
      className="relative p-8 bg-card border border-border rounded-2xl overflow-hidden group text-right"
    >
      <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <ArrowUpLeft className="w-12 h-12 text-primary rotate-[-90deg]" />
      </div>
      
      <p className="text-sm font-bold tracking-wide text-muted-foreground mb-4">
        {metric.label}
      </p>
      
      <div className="flex items-baseline gap-2 mb-2 justify-start flex-row-reverse">
        <span className="text-4xl md:text-5xl font-mono font-bold text-primary">
          {metric.value}
        </span>
        {metric.suffix && (
          <span className="text-xl font-semibold text-primary/80">
            {metric.suffix}
          </span>
        )}
      </div>

      {metric.description && (
        <p className="text-sm text-muted-foreground leading-relaxed mt-4">
          {metric.description}
        </p>
      )}

      <div className="absolute bottom-0 right-0 w-full h-1 bg-primary/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-right duration-500" />
    </motion.div>
  );
}

/**
 * بطاقة لعرض الخدمات والمميزات مع أيقونة
 */
export function ServiceCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <motion.div
      variants={hoverLift}
      initial="rest"
      whileHover="hover"
      className="h-full p-8 bg-card border border-border rounded-2xl flex flex-col gap-6 group hover:border-primary/50 transition-colors text-right"
    >
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
        {icon}
      </div>
      
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * بطاقة لعرض شركاء المنصات
 */
export function PlatformCard({ platform }: { platform: PlatformData }) {
  return (
    <motion.div
      whileHover={{ scale: platform.coming_soon ? 1 : 1.05 }}
      className="relative p-6 bg-secondary/50 border border-border rounded-2xl flex flex-col items-center justify-center group hover:bg-secondary transition-all cursor-default text-center h-[200px]"
    >
      {platform.logo && (
        <img
          src={platform.logo}
          alt={platform.name}
          className="w-24 h-24 object-contain mb-4 group-hover:scale-110 transition-transform"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <h4 className="font-bold text-foreground group-hover:text-primary transition-colors mb-2">
        {platform.name}
      </h4>
      {platform.category && (
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {platform.category}
        </p>
      )}
      {platform.coming_soon && (
        <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
          <span className="text-xs font-bold text-yellow-600">قريباً</span>
        </div>
      )}
    </motion.div>
  );
}

/**
 * بطاقة لعرض المدن ومناطق العمل
 */
export function CityCard({ city }: { city: CityData }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-md transition-shadow group flex-row-reverse text-right">
      <div className="p-2 bg-muted rounded-lg text-muted-foreground group-hover:text-primary transition-colors shrink-0">
        <MapPin className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-foreground">{city.name}</h4>
        <p className="text-xs text-muted-foreground uppercase tracking-tight">{city.region}</p>
      </div>
    </div>
  );
}
