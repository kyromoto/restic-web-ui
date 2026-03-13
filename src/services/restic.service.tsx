import os from "node:os";
import path, { join } from "node:path";
import { spawn } from "node:child_process";


import { ConfigSchema } from "./config.service";
import z, { ZodError } from "zod";
import { readdir, readFile, unlink, writeFile } from "node:fs/promises";



const maskPasswords = (input: any) => {
    if (typeof input !== 'object' || input === null) {
        return input;
    }

    const result = Array.isArray(input) ? [] : {};

    for (const key in input) {
        const shouldMask = key.toLowerCase().includes('passwort') ||
            key.toLowerCase().includes('password');

        if (shouldMask && typeof input[key] === 'string') {
            // @ts-ignore
            result[key] = '********';
        } else if (typeof input[key] === 'object') {
            // @ts-ignore
            result[key] = maskPasswords(input[key]); // Rekursiv für verschachtelte Objekte
        } else {
            // @ts-ignore
            result[key] = input[key];
        }
    }

    return result;
}


const maskPasswordSchema = z.any().transform(maskPasswords);



export const getSnapshots = async (repoName: string, params: ConfigSchema["repositories"][string]) => {
    "use server";
    try {
        const config = makeExecConfig(params);
        console.debug(`Running: restic snapshots`, maskPasswordSchema.parse(config));

        const data = await new Promise<string>((resolve, reject) => {

            let stdout = "";
            let stderr = "";

            const child = spawn("restic", ["snapshots", "--json"], config);

            child.stdout.on('data', data => stdout += data.toString());
            child.stderr.on('data', data => stderr += data.toString());
            child.on('close', code => code === 0 ? resolve(stdout) : reject(stderr));
            child.on('error', error => reject(error));

        });

        const snapshots = JSON.parse(data, reviver) as Types.Snapshot[];
        const parsed = z.array(Snapshot).safeParse(snapshots);
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



export const getSnapshot = async (repoName: string, snapshotId: string, params: ConfigSchema["repositories"][string]) => {
    "use server";

    let startTime = new Date();

    try {

        const cachePath = join(process.cwd(), "data", "cache", `${repoName}.${snapshotId}`);

        const readFromCache = async () => {
            startTime = new Date();
            console.debug(`Reading from cache: ${cachePath}`);
            const raw = await readFile(cachePath, "utf-8").catch(() => null);
            console.debug(`Took: ${new Date().getTime() - startTime.getTime()}ms`);

            startTime = new Date();
            console.debug(`Parsing from cache: ${cachePath}`);
            const data = raw ? JSON.parse(raw, reviver) : null;
            console.debug(`Took: ${new Date().getTime() - startTime.getTime()}ms`);
            
            return data;
        }

        const writeToCache = async (data: any) => {
            startTime = new Date();
            console.debug(`Writing to cache: ${cachePath}`);
            await writeFile(cachePath, JSON.stringify(data)).catch(() => console.error(`Failed to write to cache: ${cachePath}`));
            console.debug(`Took: ${new Date().getTime() - startTime.getTime()}ms`);
        }

        const readFromRepository = async () => {
        
            const config = makeExecConfig(params);
            
            startTime = new Date();
            console.debug(`Running: restic ls ${snapshotId} --json`, maskPasswordSchema.parse(config));

            const data = await new Promise<string>((resolve, reject) => {

                let stdout = "";
                let stderr = "";

                const child = spawn("restic", ["ls", snapshotId, "--json"], config);

                child.stdout.on('data', data => stdout += data.toString());
                child.stderr.on('data', data => stderr += data.toString());
                child.on('close', code => code === 0 ? resolve(stdout) : reject(stderr));
                child.on('error', error => reject(error));

            });

            console.debug(`Took: ${new Date().getTime() - startTime.getTime()}ms`);


            startTime = new Date();
            console.debug(`Process data (1)...`);
            const files = data
                .trim()
                .split("\n")
                .slice(1)
                .filter(line => line.trim().length > 0);
            console.debug(`Took: ${new Date().getTime() - startTime.getTime()}ms`);


            startTime = new Date();
            console.debug(`Process data (2)...`);
            const parsedFiles = files.map(line => JSON.parse(line, reviver) as Types.File);
            console.debug(`Took: ${new Date().getTime() - startTime.getTime()}ms`);

            return parsedFiles;
        }

        const files = await (async () => {
            const cachedData = await readFromCache();
            if (cachedData) return cachedData;
            const repoData = await readFromRepository();
            await writeToCache(repoData);
            return repoData;
        })();



        const parsed = z.array(File).safeParse(files);
        if (!parsed.success) throw new Error(parsed.error.message);
        return parsed.data;
    } catch (error: any) {
        console.error(`Failed to get snapshot: ${error.message || error}`);
        throw new Error("Failed to get snapshot");
    }
};



export const getVersion = async () => {
    "use server";
    try {
        console.debug(`Running: restic version`);

        const data = await new Promise<string>((resolve, reject) => {

            let stdout = "";
            let stderr = "";

            const child = spawn("restic", ["version", "--json"]);

            child.stdout.on('data', data => stdout += data.toString());
            child.stderr.on('data', data => stderr += data.toString());
            child.on('close', code => code === 0 ? resolve(stdout) : reject(stderr));
            child.on('error', error => reject(error));

        });

        const version = JSON.parse(data, reviver) as Types.Version;
        const parsed = Version.safeParse(version);
        if (!parsed.success) throw new Error(parsed.error.message);
        return parsed.data;
    } catch (error: any) {
        console.error(`Failed to get version: ${error.message || error}`);
        throw new Error("Failed to get version");
    }
}


export const invalidateSnapshotCache = async (repoName: string, params: ConfigSchema["repositories"][string]) => {
    "use server";
    try {
        const cachePath = join(process.cwd(), "data", "cache");

        const files = await readdir(cachePath)

        for (const file of files) {
            if (file.startsWith(`${repoName}.`)) {
                const filePath = join(cachePath, file);
                await unlink(filePath).catch(() => console.error(`Failed to invalidate snapshot cache: ${filePath}`));
            }
        }
    } catch (error: any) {
        console.error(`Failed to invalidate snapshot cache: ${error.message || error}`);
    }
}



export type Snapshot = z.infer<typeof Snapshot>;
export const Snapshot = z.object({
    id: z.string(),
    short_id: z.string(),
    hostname: z.string(),
    username: z.string(),
    time: z.date(),
    tree: z.string(),
    paths: z.array(z.string()),
    excludes: z.array(z.string()).optional(),
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
    inode: z.number().optional(),
    message_type: z.string(),
    struct_type: z.string(),
});


export type Version = z.infer<typeof Version>;
export const Version = z.object({
    message_type: z.string(),
    version: z.string(),
    go_version: z.string(),
    go_os: z.string(),
    go_arch: z.string(),
});


export namespace Types {
    export type Snapshot = z.infer<typeof Snapshot>
    export type File = z.infer<typeof File>
    export type Version = z.infer<typeof Version>
}

// const zodReviver = (key: string, value: any) => {

//     if (typeof value === "string") {

//         const datetime = z.iso.datetime({ offset: true }).safeParse(value);

//         if (datetime.success) {
//             return new Date(datetime.data);
//         }
//     }

//     return value;
// };

// ISO 8601 datetime mit offset – schneller Vorab-Check
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

const reviver = (key: string, value: any) => {
    if (typeof value === "string" && ISO_DATETIME_RE.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date;
        }
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
                    PATH: process.env.PATH,
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
                    PATH: process.env.PATH,
                }
            }
        }

        default: {
            throw new Error(`Unknown repository type: ${params}`);
        }
    }
}