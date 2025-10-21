import { Title } from "@solidjs/meta";
import { query, useParams } from "@solidjs/router";
import { makePersisted } from "@solid-primitives/storage";
import { createResource, createSignal, For, Match, Switch } from "solid-js";

import * as ResticService from "~/services/restic.service";
import { useConfig } from "~/contexts/app.context";
import { PaginationComponent } from "~/components/pagination.component";
import ListSettingsComponent, { ListValues } from "~/components/list-settings.component";

import "./snapshot-files.css";
import { snapshot } from "vinxi/dist/types/runtime/storage";
import LoadingAlertComponent from "~/components/loading-alert.component";



export default function SnapshotDetailsView() {

    const [getListSettings, setListSettings] = makePersisted(createSignal<ListValues>({ perPage: 10, order: "newest" }));
    const [getPage, setPage] = createSignal(1);
    const left = () => (getPage() - 1) * getListSettings().perPage;
    const right = () => getPage() * getListSettings().perPage;

    const config = useConfig();
    const params = useParams();
    const getFiles = query(ResticService.getSnapshot, "get-restic-files");
    
    const id = () => params.snapshotId;
    const [files, { refetch }] = createResource(id, async () => {
        // console.debug(`Loading snapshot ${id()} for ${params.repositoryId} ...`, config);
        const result = Object.entries(config.repositories).find(([key, value]) => key === params.repositoryId)?.[1];
    
        // console.debug(`${params.repositoryId} -> ${JSON.stringify(result, null, 2)}`);
        const snapshots = result ? getFiles(result, id()) : [];
        
        // console.debug(`${params.repositoryId} -> ${id()} -> ${JSON.stringify(snapshots, null, 2)}`);
        return snapshots;
    });

    const sortFn = (a: ResticService.Types.File, b: ResticService.Types.File) => {
        return getListSettings().order === "newest" ? b.mtime.getTime() - a.mtime.getTime() : a.mtime.getTime() - b.mtime.getTime();
    }
    
    return (
        <>
            <Title>Files | {id()}</Title>
            <Switch fallback={<div class="alert alert-warning text-center font-monospace">{files.state}...</div>}>
                <Match when={files.state === "ready"}>
                    <main class="h-100">
                        <PaginationComponent total={files()?.length || 0} perPage={getListSettings().perPage} currentPage={getPage()} onPageChange={setPage}>
                            <div style={{ display: "flex", "flex-direction": "column", gap: "1rem" }}>
                                <ListSettingsComponent order={getListSettings().order} perPage={getListSettings().perPage} onChange={setListSettings} />
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
                </Match>

                <Match when={files.error}>
                    <div class="alert alert-danger text-center font-monospace">{files.error.message || files.error}</div>
                </Match>

                <Match when={files.loading}>
                    <LoadingAlertComponent>Loading snapshot...</LoadingAlertComponent>
                </Match>
            </Switch>
        </>
    );
}