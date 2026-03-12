import { A, query } from "@solidjs/router";
import { createResource, createSignal, For, Match, Suspense, Switch } from "solid-js";

import { useConfig } from "~/contexts/app.context";
import * as ResticService from "~/services/restic.service";

import "./sidebar.component.css";




export function SidebarComponent() {

    const config = useConfig();
    const getVersion = query(ResticService.getVersion, "get-restic-version");

    const [version, { refetch }] = createResource(getVersion, async () => getVersion());
    const [repositories] = createSignal((() => {
        return Object.keys(config.repositories).map(key => ({
            label: key, icon: "card-list", path: `/repositories/${key}/snapshots`    
        }))
    })());

    const links = [
        { label: "Dashboard", icon: "speedometer2", path: "/" },
    ]

    return (
        <div class="sidebar p-2" style={{ display: "grid", "grid-template-columns": "1fr", "grid-template-rows": "auto 1fr auto", "align-items": "start", gap: "2rem", height: "100%" }}>
            <ul class="nav nav-pills d-flex flex-column">
                <For each={links}>
                    { link => (
                        <li class="nav-item">
                            <A href={link.path} class="nav-link d-flex" style={{ gap: "1rem" }} end>
                                <i class={`bi bi-${link.icon}`} />
                                <span>{link.label}</span>
                            </A>
                        </li>
                    )}
                </For>
            </ul>

            <Suspense fallback={<div class="font-monospace" style={{ "display": "grid", "place-items": "center", "height": "100%", "width": "100%" }}>Loading...</div>}>
                <div class="d-flex flex-column gap-2">
                    <h1 class="fs-6 fw-normal text-muted m-0 p-0 ps-1">Repositories</h1>
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
                </div>
            </Suspense>

            <Switch fallback={<div class="alert alert-info text-center font-monospace">Retrieving restic version...</div>}>
                <Match when={version.state === "ready"}>
                    <div class="alert alert-info font-monospace m-0">
                        <div style={{ display: "grid", "grid-template-columns": "auto 1fr", "row-gap": ".25rem", "column-gap": "1rem", "font-size": "0.75rem"}}>
                            <span>Restic:</span> <span>{version()?.version}</span>
                            <span>Go:</span><span>{version()?.go_version.replace(/go/g, "")}</span>
                        </div>
                        
                    </div>
                </Match>

                <Match when={version.error}>
                    <div class="alert alert-danger text-center font-monospace">{version.error}</div>
                </Match>
            </Switch>
        </div>
    )

}