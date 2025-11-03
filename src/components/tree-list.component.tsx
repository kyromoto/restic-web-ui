import { createMemo, createSignal, For, Show } from "solid-js";

import "./tree-list.component.css";

export type FlatNodeType = "dir" | "file" | "symlink" | "unkown";

export type FlatNode<U,V> = {
    id: U,
    parentId: U | null,
    depth: number
    path: string,
    type: FlatNodeType,
    label: string,
}


export type FlatTreeProps<U,V> = {
    items: Array<FlatNode<U,V>>
    openUntil?: number
}



export default function TreeListComponent<U,V>(props: FlatTreeProps<U,V>) {

    const children = createMemo(() => {

        const map = new Map<U | null, FlatNode<U,V>[]>();

        for (const item of props.items) {
            if (!map.has(item.parentId)) {
                map.set(item.parentId, []);
            }
            map.get(item.parentId)!.push(item);
        }

        for (const children of map.values()) {
            children.sort((a, b) => {
                if ((a.type === "dir") !== (b.type === "dir")) {
                    return a.type === "dir" ? -1 : 1;
                }

                return a.label.localeCompare(b.label);
            });
        }

        return map;

    });


    const TreeNode = (nodeProps: { root: FlatNode<U,V>, depth: number }) => {

        const [isExpanded, setIsExpanded] = createSignal(nodeProps.depth < (props.openUntil || 1));
        
        const getIcon = (type: FlatNodeType, isExpanded: boolean) => {
            switch (type) {
                case "dir": {
                    return isExpanded ? "bi-folder" : "bi-folder-fill";
                }
                case "file": {
                    return "bi-file-earmark";
                }
                case "symlink": {
                    return "bi-link-45deg";
                }
                default: {
                    return "bi-question";
                }
            }
        }

        return (
            <ul class="tree">
                <li class="tree-item">
                    <span class="tree-item-label" onClick={() => setIsExpanded(!isExpanded())}>
                        <i class={`bi ${getIcon(nodeProps.root.type, isExpanded())}`} />
                        {nodeProps.root.label}
                    </span>
                    <Show when={isExpanded()}>
                        <For each={children().get(nodeProps.root.id)}>
                            {child => <TreeNode root={child} depth={nodeProps.depth+1} />}
                        </For>
                    </Show>
                </li>
            </ul>
        )
    }

    return (
        <TreeNode root={props.items[0]} depth={0} />
    );
}