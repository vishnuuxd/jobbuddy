import { TabBar } from "@/components/ui/TabBar";
import styles from "./tabs.module.css";

// Home, History and Profile. Only routes in this group render the tab bar, so the
// call, writing, scorecard, retry and streak screens can't show it by accident.
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      {children}
      <TabBar />
    </div>
  );
}
