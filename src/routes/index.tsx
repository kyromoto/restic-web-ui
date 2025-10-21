import { Title } from "@solidjs/meta";
import { For, Suspense } from "solid-js";

import { useConfig } from "~/contexts/app.context";

import "./index.css";

export default function DashboardView() {
  
  const config = useConfig();

  return (
    <main>
      <Title>Dashboard</Title>
      <Suspense fallback={<div>Loading...</div>}>
        <ul class="list-group repositories">
          <For each={Object.entries(config.repositories)}>
            { ([key, value]) => (
              <li class="list-group-item">
                <span class="column name">{key}</span>
                <span class="column type">{value.type}</span>

                {value.type === "file" && (
                  <div class="column details d-flex gap-2">
                    <span><i class="bi bi-folder me-2" />{value.path}</span>
                  </div>
                )}

                {value.type === "rest" && (
                  <div class="column details d-flex flex-column gap-2">
                    <span><i class="bi bi-link-45deg me-2" />{value.url}</span>
                    <span><i class="bi bi-person me-2" />{value.username}</span>
                  </div>
                )}
              </li>
            )}
          </For>
        </ul>
      </Suspense>
    </main>
  );
}
