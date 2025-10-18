import { For } from "solid-js";


export type ListValues = {
    order: "newest" | "oldest",
    perPage: 10 | 25 | 50 | 100
};

export type ListSettingsProps = ListValues & {
    onChange: (values: ListValues) => void
};


export default function ListSettingsComponent(props: ListSettingsProps) {
    return (
        <div class="d-flex justify-content-end gap-2">
            <div class="input-group w-auto">
                <span class="input-group-text">Order</span>
                <select class="form-select" onChange={ev => props.onChange({ ...props, order: ev.target.value as ListValues["order"] })}>
                    <For each={["newest", "oldest"]}>
                        {order => <option value={order} selected={props.order === order}>{order}</option>}
                    </For>
                </select>
            </div>

            <div class="input-group w-auto">
                <span class="input-group-text">Per page</span>
                <select class="form-select w-auto" onChange={ev => props.onChange({ ...props, perPage: Number(ev.target.value) as ListValues["perPage"] })}>
                    <For each={[10, 25, 50, 100]}>
                        {perPage => <option value={perPage} selected={props.perPage === perPage}>{perPage}</option>}
                    </For>
                </select>
            </div>
        </div>
    );
}