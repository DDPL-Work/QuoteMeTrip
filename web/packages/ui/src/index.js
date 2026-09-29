// @troublefree/ui
//
// Phase 1: Shared UI package boundary and primitives.

export const UI_PACKAGE_NAME = '@troublefree/ui';

export { AuthLayout, FormField, PasswordInput, LoadingButton, AuthError } from './auth.jsx';
export { THEME, STATUS_BADGE_TONES } from './theme.js';
export {
  AppHeader,
  Button,
  Card,
  TextInput,
  Select,
  Checkbox,
  Radio,
  Tabs,
  SegmentedControl,
  StatusBadge,
  Avatar,
  IconButton,
  Modal,
  ConfirmDialog,
  Spinner,
  Skeleton,
  Divider,
  PageHeader,
  Stepper,
  ProgressBar,
  EmptyState,
  ErrorState,
  QuotationCard,
  RequestCard,
  ConversationList,
  ConversationListItem,
  ConversationView,
  JobCard,
} from './components.jsx';
export {
  LanguageSwitcher,
  PublicHeader,
  PublicFooter,
  SectionHeading,
  DestinationCard,
  GuideCard,
  AgencyCard,
  CTASection,
} from './public-components.jsx';
