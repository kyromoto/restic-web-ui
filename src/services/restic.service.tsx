import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import child_process from "node:child_process";

import dayjs from "dayjs";
import { query } from "@solidjs/router";


import { ConfigSchema } from "./config.service";
import z, { ZodError } from "zod";

const exec = promisify(child_process.exec);



export const getSnapshots = async (params: ConfigSchema["repositories"][string]) => {
    "use server";
    try {
            const config = makeExecConfig(params);
            console.debug(`Running: restic snapshots --json`, config);
            const { stdout, stderr } = await exec("restic snapshots --json", config);
            if (stderr) throw new Error(stderr);
            const types = JSON.parse(stdout, reviver) as Types.Snapshot[];
            const parsed = z.array(Snapshot).safeParse(types);
            if (!parsed.success) throw new Error(parsed.error.message);
            return parsed.data;
    } catch (error: any) {
        if (error instanceof ZodError) {
            console.error(`Failed to get snapshots: ${error.message}`);
        }
        console.error(`Failed to get snapshots: ${error.message || error}`);
        throw new Error("Failed to get snapshots");
    }
};



export const getSnapshot = async (params: ConfigSchema["repositories"][string], snapshotId: string) => {
   "use server";
    try {
        const config = makeExecConfig(params);
        const cmd = `restic ls ${snapshotId} --json`;

        console.debug(`Running: ${cmd}`, config);
        const { stdout, stderr } = await exec(cmd, config);
        if (stderr) throw new Error(stderr);
        
        const lines = stdout.trim().split("\n");
        lines.shift();
        const files = lines
            .filter(line => line.trim().length > 0)
            .map(line => JSON.parse(line, reviver) as Types.File);

        const parsed = z.array(File).safeParse(files);
        if (!parsed.success) throw new Error(parsed.error.message);
        return parsed.data;
    } catch (error: any) {
        console.error(`Failed to get snapshot: ${error.message || error}`);
        throw new Error("Failed to get snapshot");
    }
};



export type Snapshot = z.infer<typeof Snapshot>;
export const Snapshot = z.object({
    id: z.string(),
    short_id: z.string(),
    hostname: z.string(),
    username: z.string(),
    time: z.date(),
    tree: z.string(),
    paths: z.array(z.string()),
    excludes: z.array(z.string()),
    program_version: z.string(),
    summary: z.object({
        backup_start: z.date(),
        backup_end: z.date(),
        files_new: z.number(),
        files_changed: z.number(),
        files_unmodified: z.number(),
        dirs_new: z.number(),
        dirs_changed: z.number(),
        dirs_unmodified: z.number(),
        data_blobs: z.number(),
        tree_blobs: z.number(),
        data_added: z.number(),
        data_added_packed: z.number(),
        total_files_processed: z.number(),
        total_bytes_processed: z.number(),
    }).optional()
});


export type File = z.infer<typeof File>;
export const File = z.object({
    name: z.string(),
    type: z.string(),
    path: z.string(),
    size: z.number().optional(),
    uid: z.number(),
    gid: z.number(),
    mode: z.number(),
    permissions: z.string(),
    mtime: z.date(),
    atime: z.date(),
    ctime: z.date(),
    inode: z.number(),
    message_type: z.string(),
    struct_type: z.string(),
});


export namespace Types {

    export type Snapshot = z.infer<typeof Snapshot>
    export type File = z.infer<typeof File>
    
    // export type Snapshot = {
    //     id: string
    //     short_id: string
    //     hostname: string
    //     username: string
    //     time: Date
    //     tree: string
    //     paths: Array<string>
    //     excludes: Array<string>
    //     program_version: string
    //     summary?: {
    //         backup_start: Date
    //         backup_end: Date
    //         files_new: number
    //         files_changed: number
    //         files_unmodified: number
    //         dirs_new: number
    //         dirs_changed: number
    //         dirs_unmodified: number
    //         data_blobs: number
    //         tree_blobs: number
    //         data_added: number
    //         data_added_packed: number
    //         total_files_processed: number
    //         total_bytes_processed: number
    //     }
    // }

    // export type File = {
    //     name: string
    //     type: string
    //     path: string
    //     size?: number
    //     uid: number
    //     gid: number
    //     mode: number
    //     permissions: string
    //     mtime: Date
    //     atime: Date
    //     ctime: Date
    //     inode: number
    //     message_type: string
    //     struct_type: string
    // }
}



const reviver = (_key: string, value: any) => {
    
    if (typeof value === "string" && dayjs(value).isValid()) {
        return new Date(value);
    }

    return value;
};


const makeExecConfig = (params: ConfigSchema["repositories"][string]) => {
    switch (params.type) {
        case "file": {
            return {
                env: {
                    RESTIC_REPOSITORY: `local:${params.path}`,
                    RESTIC_PASSWORD: params.secret,
                    HOME: os.homedir(),
                    XDG_CACHE_HOME: path.join(os.homedir(), ".cache"),
                }
            }
        }

        case "rest": {
            return {
                env: {
                    RESTIC_REPOSITORY: `rest:${params.url}`,
                    RESTIC_PASSWORD: params.secret,
                    RESTIC_REST_USERNAME: params.username,
                    RESTIC_REST_PASSWORD: params.password,
                    HOME: os.homedir(),
                    XDG_CACHE_HOME: path.join(os.homedir(), ".cache"),
                }
            }
        }

        default: {
            throw new Error(`Unknown repository type: ${params}`);
        }
    }
}