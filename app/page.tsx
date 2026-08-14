import { Suspense } from "react";
import { HomeView } from "@/components/equipment/HomeView";

export default function Home() {
  return (
    <Suspense>
      <HomeView />
    </Suspense>
  );
}
