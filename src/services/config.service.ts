import { join } from "node:path";
import { readFile } from "node:fs/promises";

import * as yml from "yaml";
import { z } from "zod";

import { query } from "@solidjs/router";



export const getConfigAsync = query(async () => {
    "use server";

    const CONFIG_PATH = join(process.cwd(), "data", "config.yml");

    try {
        const raw = await readFile(CONFIG_PATH, "utf-8");
        const json = yml.parse(raw);
        const parsed = await ConfigSchema.safeParseAsync(json);

        if (!parsed.success) {
            throw new Error(parsed.error.message);
        }

        return parsed.data;
    } catch (error: any) {
        console.error(`Failed to load config: ${error.message || error}`);
        throw new Error("Failed to load config");
    }
}, "get-config");




export type ConfigSchema = z.infer<typeof ConfigSchema>;
export const ConfigSchema = z.object({
    repositories: z.record(z.string(), z.discriminatedUnion("type", [
        z.object({
           type: z.literal("file"),
           secret: z.string(),
           path: z.string(),
        }),
        z.object({
            type: z.literal("rest"),
            secret: z.string(),
            url: z.string(),
            username: z.string(),
            password: z.string(),
        })
    ]))
});