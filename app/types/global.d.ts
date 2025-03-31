interface Window {
  headerImages?: {
    realm?: string;
    character?: string;
    quests?: string;
    guildhall?: string;
    achievements?: string;
  };
  mobileNavProps?: {
    tabs: string[];
    activeTab: string;
    onTabChange: (tab: string) => void;
  };
} 