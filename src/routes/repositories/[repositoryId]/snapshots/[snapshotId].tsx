import { createComputed, createEffect, createMemo, createSignal, For, Show, Suspense } from "solid-js";
import { Title } from "@solidjs/meta";
import { createAsync, useParams } from "@solidjs/router";

import * as ResticService from "~/services/restic.service";
import * as ConfigService  from "~/services/config.service";

import "./snapshot-files.css";
import { PaginationComponent } from "~/components/pagination.component";
import ListSettingsComponent, { ListValues } from "~/components/list-settings.component";


export default function SnapshotDetailsView() {

    const [getPerPage, setPerPage] = createSignal<ListValues["perPage"]>(10);
    const [getPage, setPage] = createSignal(1);
    const [getOrder, setOrder] = createSignal<"newest" | "oldest">("newest");
    const left = () => (getPage() - 1) * getPerPage();
    const right = () => getPage() * getPerPage();

    const params = useParams();
    const config = createAsync(() => ConfigService.getConfigAsync(), { initialValue: { repositories: {} } });
    const files = createAsync(async () => {
        console.debug(`Loading snapshot ${params.snapshotId} for ${params.repositoryId} ...`, config());
        const result = Object.entries(config().repositories).find(([key, value]) => key === params.repositoryId)?.[1];
        console.debug(`${params.repositoryId} -> ${JSON.stringify(result, null, 2)}`);
        const snapshots = result ? await ResticService.getSnapshot(result, params.snapshotId) : [];
        console.debug(`${params.repositoryId} -> ${params.snapshotId} -> ${JSON.stringify(snapshots, null, 2)}`);
        return snapshots;
    }, { initialValue: [] });

    const handleSettingsChange = (values: ListValues) => {
        if (values.perPage !== getPerPage()) {
            setPerPage(values.perPage);
        }

        if (values.order !== getOrder()) {
            setOrder(values.order);
        }
    }

    const sortFn = (a: ResticService.Types.File, b: ResticService.Types.File) => {
        return getOrder() === "newest" ? b.mtime.getTime() - a.mtime.getTime() : a.mtime.getTime() - b.mtime.getTime();
    }
    
    return (
        <>
            <Title>{params.repositoryId} snapshot {params.snapshotId}</Title>
            <Suspense fallback={<div class="font-monospace" style={{ "display": "grid", "place-items": "center", "height": "100%", "width": "100%" }}>Loading...</div>}>
                <main class="h-100">
                    <PaginationComponent total={files()?.length || 0} perPage={getPerPage()} currentPage={getPage()} onPageChange={setPage}>
                        <div>
                            <ListSettingsComponent order={getOrder()} perPage={getPerPage()} onChange={handleSettingsChange} />
                            <ul class="files list-group font-monospace">
                                <For each={files()?.sort(sortFn).slice(left(), right())}>
                                    {(file: ResticService.Types.File) => (
                                        <li class="list-group-item">
                                            <div class="type"><i class={`bi bi-${file.type === "dir" ? "folder" : "file-earmark"}`} /></div>
                                            <div class="path">{file.path}</div>
                                            <div class="size d-flex gap-1">
                                                {file.size && <span class="badge rounded-pill text-bg-secondary fw-normal">{`${file.size} byte`}</span>}
                                                <span class="badge rounded-pill text-bg-secondary fw-normal">{file.permissions}</span>
                                                <span class="badge rounded-pill text-bg-secondary fw-normal">{file.ctime.toUTCString()}</span>
                                                <span class="badge rounded-pill text-bg-secondary fw-normal">{file.mtime.toUTCString()}</span>
                                                <span class="badge rounded-pill text-bg-secondary fw-normal">{file.atime.toUTCString()}</span>
                                            </div>
                                        </li>
                                    )}
                                </For>
                            </ul>
                        </div>
                    </PaginationComponent>
                </main>
            </Suspense>
        </>
    );
}