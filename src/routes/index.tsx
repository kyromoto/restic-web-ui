import { Title } from "@solidjs/meta";
import { Suspense } from "solid-js";

import { useConfig } from "~/contexts/app.context";

export default function DashboardView() {
  
  const config = useConfig();

  return (
    <main>
      <Title>Dashboard</Title>
      <Suspense fallback={<div>Loading...</div>}>
        <pre>{JSON.stringify(config, null, 2)}</pre>
      </Suspense>
    </main>
  );
}
