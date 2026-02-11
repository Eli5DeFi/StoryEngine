/**
 * Optimized icon imports
 * 
 * Import only the icons we actually use to reduce bundle size.
 * Instead of importing from 'lucide-react' directly everywhere,
 * import from this file to ensure tree-shaking works properly.
 */

export {
  // Navigation
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  Home,
  
  // Actions
  Check,
  Plus,
  Minus,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Download,
  Upload,
  RefreshCw,
  
  // UI
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Filter,
  Settings,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  
  // Wallet & Money
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  LineChart,
  
  // Social
  Share2,
  Twitter,
  Github,
  Users,
  User,
  UserPlus,
  
  // Gaming
  Trophy,
  Award,
  Target,
  Zap,
  Sparkles,
  Star,
  
  // Time
  Clock,
  Calendar,
  Timer,
  
  // Other
  Book,
  Bookmark,
  Bell,
  Eye,
  EyeOff,
  Heart,
  MessageCircle,
  Shield,
  Lock,
  Unlock,
  Globe,
  MapPin,
} from 'lucide-react'

// Type export for icon props
export type { LucideProps, LucideIcon } from 'lucide-react'
