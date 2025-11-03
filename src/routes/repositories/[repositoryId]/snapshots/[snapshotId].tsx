import { Title } from "@solidjs/meta";
import { query, useParams } from "@solidjs/router";
import { makePersisted } from "@solid-primitives/storage";
import { createEffect, createMemo, createResource, createSignal, For, Match, Switch } from "solid-js";

import * as ResticService from "~/services/restic.service";
import { useConfig } from "~/contexts/app.context";
import { PaginationComponent } from "~/components/pagination.component";
import ListSettingsComponent, { ListValues } from "~/components/list-settings.component";

import "./snapshot-files.css";
import { snapshot } from "vinxi/dist/types/runtime/storage";
import LoadingAlertComponent from "~/components/loading-alert.component";
import OptionSwitcherComponent from "~/components/option-switcher.component";
import TreeListComponent, { FlatNode } from "~/components/tree-list.component";
import { create } from "domain";



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

    const [selectedRepresentation, setSelectedRepresentation] = createSignal("tree");
    const representationOptions = [
        { label: "Tree", value: "tree" },
        { label: "List", value: "list" },
    ];

    const treedata = createMemo(() => buildGroupedFlat(files() || []));

    console.table(treedata());
    console.log(treedata().length);

    
    return (
        <>
            <Title>Files | {id()}</Title>
            <Switch fallback={<div class="alert alert-warning text-center font-monospace">{files.state}...</div>}>
                <Match when={files.state === "ready"}>
                    <main class="h-100">
                        <div class="d-flex justify-content-center">
                            <OptionSwitcherComponent options={representationOptions} value={selectedRepresentation()} onChange={setSelectedRepresentation} />
                        </div>

                        <Switch>
                            <Match when={selectedRepresentation() === "list"}>
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
                            </Match>

                            <Match when={selectedRepresentation() === "tree"}>
                                <TreeListComponent items={treedata()} />
                            </Match>
                        </Switch>
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





function buildGroupedFlat (items: ResticService.File[]) {

        const nodes = new Array<FlatNode<number, string>>();
        const pathToId = new Map<string, number>();
        const rootPath = "/";

        nodes.push({
            id: 0,
            parentId: null,
            depth: 0,
            path: rootPath,
            type: "dir",
            label: rootPath
        });

        pathToId.set("/", 0);

        for (const [iIndex, item] of items.entries()) {
            
            const parts = item.path.split("/").filter(i => i.length > 0);
            let currentPath = "";

            for (const [pIndex, part] of parts.entries()) {
                
                const parentPath = currentPath.length > 0 ? currentPath : rootPath;
                currentPath += `${rootPath}${part}`;

                if (pathToId.has(currentPath)) continue;

                const id = nodes.length;

                pathToId.set(currentPath, id);

                const type = (() => {
                    switch (item.type) {
                        case "dir": return "dir" satisfies FlatNode<number, string>["type"];
                        case "file": return "file" satisfies FlatNode<number, string>["type"];
                        case "symlink": return "symlink" satisfies FlatNode<number, string>["type"];
                        default: return "unknown" as FlatNode<number, string>["type"];
                    }
                })();

                nodes.push({
                    id,
                    parentId: pathToId.get(parentPath) || 0,
                    path: item.path,
                    depth: pIndex + 1,
                    type,
                    label: part
                }); 

            }
        }

        return nodes;

    }