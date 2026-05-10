import { IconDatabase, IconFileWord, IconReport } from '@tabler/icons-react';
import {
  CircleHelpIcon,
  Home,
  SearchIcon,
  Settings2Icon,
  Trophy,
  UserCog,
} from 'lucide-react';

export const navMain = [
  { title: 'Home', icon: Home, to: '/dashboard' },
  { title: 'Tournaments', icon: Trophy, to: '/dashboard/tournaments' },
  { title: 'Athletes', icon: UserCog, to: '/dashboard/athletes' },
];

export const navSecondary = [
  {
    title: 'Settings',
    url: '#',
    icon: Settings2Icon,
  },
  {
    title: 'Get Help',
    url: '#',
    icon: CircleHelpIcon,
  },
  {
    title: 'Search',
    url: '#',
    icon: SearchIcon,
  },
];

export const navDocuments = [
  {
    name: 'Data Library',
    url: '#',
    icon: IconDatabase,
  },
  {
    name: 'Reports',
    url: '#',
    icon: IconReport,
  },
  {
    name: 'Word Assistant',
    url: '#',
    icon: IconFileWord,
  },
];
