import { createSign } from "crypto";
import { createContext, createEffect, createSignal, For, JSX } from "solid-js";



export default function OptionSwitcherComponent(props: { options: Array<{ label: string | JSX.Element, value: string }>, value: string, onChange: (value: string) => void }) {

    const [options] = createSignal(props.options);

    return (
        <>
            <div class="btn-group btn-group-sm" role="group">
                <For each={options()}>
                    {option => (
                        <>
                            <input
                                type="radio"
                                class="btn-check"
                                name="btnradio"
                                id={`btnradio${option.value}`}
                                autocomplete="off"
                                checked={option.value === props.value}
                                onChange={() => props.onChange(option.value)}
                            />
                            <label
                                class="btn btn-outline-primary"
                                for={`btnradio${option.value}`}
                            >
                                {option.label}
                            </label>
                        </>
                    )}
                </For>
            </div>
        </>
    );
}