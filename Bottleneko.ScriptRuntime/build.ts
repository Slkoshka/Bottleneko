import { build, emptyDir } from '@deno/dnt';
import { readFile, writeFile, readdir, rename, rm } from 'node:fs/promises';

await emptyDir('./dist');

for (const pkg of ['neko']) {
    const denoJson: {
        name: string;
        version: string;
        exports: Record<string, string>;
    } = JSON.parse(await readFile(`./${pkg}/deno.json`, 'utf8'));

    await build({
        entryPoints: Object.entries(denoJson.exports).map(([name, path]) => ({
            name,
            path: `./${pkg}/${path}`,
        })),
        outDir: `./dist/${pkg}`,
        shims: {
            deno: true,
        },
        package: {
            name: denoJson.name,
            version: denoJson.version,
        },
        typeCheck: 'single',
        declaration: 'separate',
        scriptModule: false,
        esModule: true,
        skipSourceOutput: true,
        test: false,
    });

    await rm(`./dist/${pkg}/esm`, { recursive: true, force: true });

    for (const file of await readdir(`./dist/${pkg}/types`)) {
        await rename(`./dist/${pkg}/types/${file}`, `./dist/${pkg}/${file}`);
    }

    await rm(`./dist/${pkg}/types`, { recursive: true, force: true });
    await rm(`./dist/${pkg}/package-lock.json`, { force: true });
    await rm(`./dist/${pkg}/.npmignore`, { force: true });

    const packageJson: {
        exports: object;
        module: string;
        types: string;
        _generatedBy: string;
        scripts: object;
    } = JSON.parse(await readFile(`./dist/${pkg}/package.json`, 'utf8'));
    
    await writeFile(`./dist/${pkg}/package.json`, JSON.stringify({
        ...packageJson,
        exports: undefined,
        module: undefined,
        types: undefined,
        _generatedBy: undefined,
        scripts: undefined,
    }), { encoding: 'utf8' });
}
