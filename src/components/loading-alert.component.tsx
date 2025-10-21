import { JSX } from "solid-js"

export default function LoadingAlertComponent(props: { children: JSX.Element }) {
    return (
        <div class="alert alert-info text-center font-monospace d-flex gap-2 align-items-center justify-content-center">
            <span>
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </span>
            <span>
                {props.children}
            </span>
        </div>
    );
}