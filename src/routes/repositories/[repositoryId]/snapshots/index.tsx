import { createEffect, createSignal, For, Suspense } from "solid-js";
import { Title } from "@solidjs/meta";
import { A, createAsync, useParams } from "@solidjs/router";

import "./index.css";

import * as ResticService from "~/services/restic.service";
import * as ConfigService  from "~/services/config.service";
import { PaginationComponent } from "~/components/pagination.component";



export default function SnaphotsView() {

    const [getFilesPerpage, setFilesPerpage] = createSignal(10);
    const [getPage, setPage] = createSignal(1);
    const left = () => (getPage() - 1) * getFilesPerpage();
    const right = () => getPage() * getFilesPerpage();

    const params = useParams();
    const config = createAsync(() => ConfigService.getConfigAsync(), { initialValue: { repositories: {} } });
    const snapshots = createAsync(async () => {
        console.debug(`Loading snapshots for ${params.repositoryId} ...`, config());
        const result = Object.entries(config().repositories).find(([key, value]) => key === params.repositoryId)?.[1];
        console.debug(`${params.repositoryId} -> ${JSON.stringify(result, null, 2)}`);
        const snapshots = result ? await ResticService.getSnapshots(result) : [];
        console.debug(`${params.repositoryId} -> ${JSON.stringify(snapshots, null, 2)}`);
        return snapshots;
    });

    createEffect(() => console.debug(`Current page: ${getPage()}`));
    
    return (
        <Suspense fallback={<div class="font-monospace" style={{ "display": "grid", "place-items": "center", "height": "100%", "width": "100%" }}>Loading...</div>}>
            <Title>{params.repositoryId} snapshots</Title>
            <main class="h-100">
                <PaginationComponent total={snapshots()?.length || 0} perPage={getFilesPerpage()} currentPage={getPage()} onPageChange={setPage}>
                    <div class="list-group snapshots">
                        <For each={snapshots()?.slice(left(), right())}>
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
                </PaginationComponent>
            </main>
        </Suspense>
    );
}