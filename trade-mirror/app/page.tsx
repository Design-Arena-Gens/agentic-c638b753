import Dashboard from "@/components/dashboard";
import { getLogs, getMirrorState } from "@/lib/state";

export default function Home() {
  const initialState = getMirrorState();
  const initialLogs = getLogs();

  return <Dashboard initialState={initialState} initialLogs={initialLogs} />;
}
