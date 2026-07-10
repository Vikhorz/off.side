import { PredictionDashboard } from "@/components/prediction-dashboard";
import { getDashboardData } from "@/lib/demo-store";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  const currentUser = await getCurrentUser();
  const data = await getDashboardData(currentUser);

  return <PredictionDashboard data={data} />;
}
