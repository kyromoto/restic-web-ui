import { A } from "@solidjs/router";
import { createSignal, For, Suspense } from "solid-js";

import { useConfig } from "~/contexts/app.context";

import "./sidebar.component.css";




export function SidebarComponent() {

    const config = useConfig();
    const [repositories] = createSignal((() => {
        return Object.keys(config.repositories).map(key => ({
            label: key, icon: "card-list", path: `/repositories/${key}/snapshots`    
        }))
    })());

    const links = [
        { label: "Dashboard", icon: "speedometer2", path: "/" },
    ]

    return (
        <div class="sidebar p-2 d-flex flex-column" style={{ gap: "1rem" }}>
            <ul class="nav nav-pills d-flex flex-column">
                <For each={links}>
                    { link => (
                        <li class="nav-item">
                            <A href={link.path} class="nav-link d-flex" style={{ gap: "1rem" }}>
                                <i class={`bi bi-${link.icon}`} />
                                <span>{link.label}</span>
                            </A>
                        </li>
                    )}
                </For>
            </ul>

            <Suspense fallback={<div class="font-monospace" style={{ "display": "grid", "place-items": "center", "height": "100%", "width": "100%" }}>Loading...</div>}>
                <ul class="nav nav-pills d-flex flex-column">
                    <For each={repositories()}>
                        {repo => (
                            <li class="nav-item">
                                <A href={repo.path} class="nav-link d-flex" style={{ gap: "1rem" }}>
                                    <i class={`bi bi-${repo.icon}`} />
                                    <span>{repo.label}</span>
                                </A>
                            </li>
                        )}
                    </For>
                </ul>
            </Suspense>
        </div>
    )

}