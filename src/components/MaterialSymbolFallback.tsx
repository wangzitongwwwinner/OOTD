import {useLayoutEffect} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bot,
  Brain,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CirclePlus,
  Database,
  Hand,
  Heart,
  House,
  Image,
  LayoutGrid,
  LogOut,
  MapPin,
  MessageCircle,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Thermometer,
  TrainFront,
  Trash2,
  Trees,
  Upload,
  WandSparkles,
  X,
  type LucideIcon,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  ac_unit: Sun,
  add: Plus,
  add_circle: CirclePlus,
  arrow_back: ArrowLeft,
  arrow_downward: ArrowDown,
  arrow_upward: ArrowUp,
  auto_awesome: Sparkles,
  business_center: BriefcaseBusiness,
  calendar_today: CalendarDays,
  chat: MessageCircle,
  check: Check,
  check_circle: CheckCircle2,
  chevron_right: ChevronRight,
  close: X,
  cognition: Brain,
  database: Database,
  delete: Trash2,
  edit: Pencil,
  expand_more: ChevronDown,
  favorite: Heart,
  forest: Trees,
  gesture: Hand,
  help_outline: CircleHelp,
  home: House,
  location_on: MapPin,
  logout: LogOut,
  photo: Image,
  photo_camera: Camera,
  photo_filter: WandSparkles,
  policy: ShieldCheck,
  publish: Upload,
  refresh: RefreshCw,
  search: Search,
  shopping_bag: ShoppingBag,
  smart_toy: Bot,
  styler: Palette,
  subway: TrainFront,
  sync: RefreshCw,
  thermostat: Thermometer,
  wb_sunny: Sun,
  widgets: LayoutGrid,
};

const roots = new WeakMap<HTMLElement, Root>();

export default function MaterialSymbolFallback() {
  useLayoutEffect(() => {
    let scheduled = false;

    const renderIcons = () => {
      scheduled = false;

      document.querySelectorAll<HTMLElement>('.material-symbols-outlined').forEach((element) => {
        const name = element.dataset.iconName ?? element.textContent?.trim();
        const Icon = name ? icons[name] : undefined;

        if (!Icon) return;

        element.dataset.iconName = name;
        element.setAttribute('aria-label', name);
        element.setAttribute('role', 'img');

        let root = roots.get(element);
        if (!root) {
          root = createRoot(element);
          roots.set(element, root);
        }

        root.render(<Icon aria-hidden="true" size="1em" strokeWidth={1.8} />);
      });
    };

    const scheduleRender = () => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(renderIcons);
    };

    renderIcons();
    const observer = new MutationObserver(scheduleRender);
    observer.observe(document.body, {childList: true, characterData: true, subtree: true});

    return () => observer.disconnect();
  });

  return null;
}
