import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import child_process from "node:child_process";

import dayjs from "dayjs";
import { query } from "@solidjs/router";


import { ConfigSchema } from "./config.service";

const exec = promisify(child_process.exec);



export const getSnapshots = query(async (params: ConfigSchema["repositories"][string]) => {
    "use server";
    try {
            const config = makeExecConfig(params);
            console.debug(`Running: restic snapshots --json`, config);
            const { stdout, stderr } = await exec("restic snapshots --json", config);
            if (stderr) throw new Error(stderr);
            return JSON.parse(stdout, reviver) as Types.Snapshot[];
    } catch (error: any) {
        console.error(`Failed to get snapshots: ${error.message || error}`);
        throw new Error("Failed to get snapshots");
    }
}, "get-restic-snapshots");



export const getSnapshot = query(async (params: ConfigSchema["repositories"][string], snapshotId: string) => {
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
        return files;
    } catch (error: any) {
        console.error(`Failed to get snapshot: ${error.message || error}`);
        throw new Error("Failed to get snapshot");
    }
}, "get-restic-snapshot");


export namespace Types {
    export type Snapshot = {
        id: string
        short_id: string
        hostname: string
        username: string
        time: Date
        tree: string
        paths: Array<string>
        excludes: Array<string>
        program_version: string
        summary?: {
            backup_start: Date
            backup_end: Date
            files_new: number
            files_changed: number
            files_unmodified: number
            dirs_new: number
            dirs_changed: number
            dirs_unmodified: number
            data_blobs: number
            tree_blobs: number
            data_added: number
            data_added_packed: number
            total_files_processed: number
            total_bytes_processed: number
        }
    }

    export type File = {
        name: string
        type: string
        path: string
        size?: number
        uid: number
        gid: number
        mode: number
        permissions: string
        mtime: Date
        atime: Date
        ctime: Date
        inode: number
        message_type: string
        struct_type: string
    }
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