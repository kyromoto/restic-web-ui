import z from "zod";
import { createStore } from "solid-js/store";
import { createAsync } from "@solidjs/router";
import { createContext, createEffect, JSX, useContext } from "solid-js";

import * as ConfigService  from "~/services/config.service";

export type AppContextSchema = z.infer<typeof AppContextSchema>;
export const AppContextSchema = z.object({
  config: ConfigService.ConfigSchema
});


const AppContext = createContext<AppContextSchema>();

export const useConfig = () => {
  const appContext = useContext(AppContext);
  if (!appContext) {
    throw new Error("AppContext is not available");
  }
  return appContext.config;
}


export function AppContextProvider(props: { children: JSX.Element }) {

  const config = createAsync(() => ConfigService.getConfigAsync(), { initialValue: { repositories: {} } });
  const [store, setStore] = createStore<AppContextSchema>({ config: config() });

  createEffect(() => setStore("config", config()));

  return (
    <AppContext.Provider value={store}>
      {props.children}
    </AppContext.Provider>
  )
}