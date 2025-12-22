import { execSync } from 'child_process';
import { copyFileSync, chmodSync, writeFileSync, unlinkSync } from 'fs';
import { platform, arch } from 'os';
import { basename } from 'path';

const args = process.argv.slice(2);
const inputFile = args.find(arg => !arg.startsWith('--'));
const outputName = args.find(arg => arg.startsWith('--output='))?.split('=')[1];
const keepBlob = args.includes('--keep-blob');
const keepConfig = args.includes('--keep-config');

if (!inputFile) {
    console.error('Usage: node build.js <input-file.js> [--output=name] [--keep-blob] [--keep-config]');
    process.exit(1);
}

const finalOutputName = outputName || basename(inputFile, '.js');
const currentPlatform = platform();
const currentArch = arch();

const PLATFORMS = {
    win32: { ext: '.exe', sign: false },
    darwin: { ext: '', sign: true },
    linux: { ext: '', sign: false }
};

const config = PLATFORMS[currentPlatform];
const binaryName = `${finalOutputName}${config.ext}`;
const blobName = 'sea-prep.blob';
const configName = 'sea-config.json';

console.log(`Building: ${inputFile} → ${binaryName}`);

try {
    const seaConfig = {
        main: inputFile,
        output: blobName,
        disableExperimentalSEAWarning: true
    };
    writeFileSync(configName, JSON.stringify(seaConfig, null, 2));

    execSync(`node --experimental-sea-config ${configName}`, { stdio: 'inherit' });

    copyFileSync(process.execPath, binaryName);

    if (currentPlatform !== 'win32') {
        chmodSync(binaryName, 0o755);
    }

    if (currentPlatform === 'win32') {
        try {
            execSync(`signtool remove /s ${binaryName}`, { stdio: 'inherit' });
        } catch (e) {
            console.warn('Signtool unavailable');
        }
    }

    execSync(
        `npx postject ${binaryName} NODE_SEA_BLOB ${blobName} ` +
        `--sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
        { stdio: 'inherit' }
    );

    if (config.sign) {
        execSync(`codesign --sign - ${binaryName}`, { stdio: 'inherit' });
    }

    if (!keepBlob) unlinkSync(blobName);
    if (!keepConfig) unlinkSync(configName);

    console.log(`✅ ${binaryName}`);
} catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
}