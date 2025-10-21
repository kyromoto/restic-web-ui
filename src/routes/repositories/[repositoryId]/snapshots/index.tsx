import { Title } from "@solidjs/meta";
import { makePersisted } from "@solid-primitives/storage";
import { A, createAsync, query, useParams } from "@solidjs/router";
import { createEffect, createResource, createSignal, For, Match, Suspense, Switch } from "solid-js";

import * as ResticService from "~/services/restic.service";
import ListSettingsComponent, { ListValues } from "~/components/list-settings.component";
import { useConfig } from "~/contexts/app.context";
import { PaginationComponent } from "~/components/pagination.component";

import "./index.css";
import LoadingAlertComponent from "~/components/loading-alert.component";




export default function SnaphotsView() {

    const [getListSettings, setListSettings] = makePersisted(createSignal<ListValues>({ perPage: 10, order: "newest" }));
    const [getPage, setPage] = createSignal(1);
    const left = () => (getPage() - 1) * getListSettings().perPage;
    const right = () => getPage() * getListSettings().perPage;

    const config = useConfig();
    const params = useParams();
    const getSnapshots = query(ResticService.getSnapshots, "get-restic-snapshots");

    const id = () => params.repositoryId;
    const [snapshots, { refetch }] = createResource(id, async () => {
        // console.debug(`Loading snapshots for ${id()} ...`, config);
        const result = Object.entries(config.repositories).find(([key, value]) => key === id())?.[1];
        
        // console.debug(`${id()} -> ${JSON.stringify(result, null, 2)}`);
        const snapshots = result ? getSnapshots(result) : [];
        
        // console.debug(`${id()} -> ${JSON.stringify(snapshots, null, 2)}`);
        return snapshots;
    });

    const sortFn = (a: ResticService.Types.Snapshot, b: ResticService.Types.Snapshot) => {
        return getListSettings().order === "newest" ? b.time.getTime() - a.time.getTime() : a.time.getTime() - b.time.getTime();
    }

    createEffect(() => console.debug(`Current page: ${getPage()}`));
    
    return (
        <>
            <pre>{JSON.stringify(snapshots, null, 2)}</pre>
            <Title>Snaphots | {id()}</Title>
            <Switch fallback={<div class="alert alert-info text-center font-monospace">Loading ...</div>}>
                <Match when={snapshots.state === "ready"}>
                    <main class="h-100">
                        <PaginationComponent total={snapshots()?.length || 0} perPage={getListSettings().perPage} currentPage={getPage()} onPageChange={setPage}>
                            <div style={{ display: "flex", "flex-direction": "column", gap: "1rem" }}>
                                <ListSettingsComponent order={getListSettings().order} perPage={getListSettings().perPage} onChange={setListSettings} />
                                <div class="list-group snapshots w-100">
                                    <For each={snapshots()?.sort(sortFn).slice(left(), right())}>
                                        {(snapshot: ResticService.Types.Snapshot) => (
                                            <A href={`/repositories/${params.repositoryId}/snapshots/${snapshot.short_id}`} class="list-group-item list-group-item-action font-monospace">
                                                <span class="id">{snapshot.short_id}</span>
                                                <span class="time">{snapshot.time.toLocaleString()}</span>
                                                <span class="host">{snapshot.hostname}</span>
                                                <span class="username">{snapshot.username}</span>
                                                <span class="app-version">{snapshot.program_version}</span>
                                                <span class="bytes">{snapshot.summary ? Math.round(snapshot.summary.total_bytes_processed / 1024 / 1024) : "-"} MiB</span>
                                                <span class="files"><i class="bi bi-file" /> {snapshot.summary?.files_new || "-"} | {snapshot.summary?.files_changed || "-"} | {snapshot.summary?.files_unmodified || "-"}</span>
                                                <span class="dirs"><i class="bi bi-folder" /> {snapshot.summary?.dirs_new || "-"} | {snapshot.summary?.dirs_changed || "-"} | {snapshot.summary?.dirs_unmodified || "-"}</span>
                                            </A>
                                        )}
                                    </For>
                                </div>
                            </div>
                        </PaginationComponent>
                    </main>
                </Match>

                <Match when={snapshots.error}>
                    <div class="alert alert-danger text-center font-monospace">{snapshots.error.message || snapshots.error}</div>
                </Match>

                <Match when={snapshots.loading}>
                    <LoadingAlertComponent>Loading snapshots ...</LoadingAlertComponent>
                </Match>
            </Switch>
        </>
    );
}