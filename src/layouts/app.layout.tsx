import { MetaProvider } from "@solidjs/meta";
import { Suspense } from "solid-js";

import { SidebarComponent } from "~/components/sidebar.component";
import { AppContextProvider } from "~/contexts/app.context";

import "./app.layout.css";





export default function AppLayout(props: any) {
    return (
        <MetaProvider>
            <Suspense>
                <AppContextProvider>
                    <div class="app layout">
                        <div class="sidebar">
                            <SidebarComponent />
                        </div>
                        <div class="main">
                            {props.children}
                        </div>
                    </div>
                </AppContextProvider>
            </Suspense>
        </MetaProvider>
    )
}