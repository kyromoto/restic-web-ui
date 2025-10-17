import { Title } from "@solidjs/meta";
import { createAsync } from "@solidjs/router";
import { Suspense } from "solid-js";

import * as ConfigService  from "~/services/config.service";

export default function DashboardView() {
  
  const config = createAsync(() => ConfigService.getConfigAsync(), { initialValue: { repositories: {} } });

  return (
    <main>
      <Title>Dashboard</Title>
      <Suspense fallback={<div>Loading...</div>}>
        <pre>{JSON.stringify(config(), null, 2)}</pre>
      </Suspense>
    </main>
  );
}
