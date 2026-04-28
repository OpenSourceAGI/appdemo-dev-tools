#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const generateApp = require('../src/generate');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log('Welcome to the Mobile Wrapper Generator!\n');

    // Try to infer name from parent package.json
    let defaultName = '';
    try {
        const parentPackagePath = path.resolve(process.cwd(), '../package.json');
        if (fs.existsSync(parentPackagePath)) {
            const pkg = JSON.parse(fs.readFileSync(parentPackagePath, 'utf8'));
            if (pkg.name) {
                defaultName = pkg.name;
            }
        }
    } catch (e) {
        // Ignore error
    }

    // Prompt for App Name
    const nameInput = await question(`App Name${defaultName ? ` (${defaultName})` : ''}: `);
    const name = nameInput.trim() || defaultName;

    if (!name) {
        console.error('Error: App Name is required.');
        process.exit(1);
    }

    // Prompt for URL
    const url = await question('Website URL (e.g., https://example.com): ');

    if (!url) {
        console.error('Error: Website URL is required.');
        process.exit(1);
    }

    // Prompt for EAS
    const easInput = await question('Enable EAS (Expo Application Services) for auto-submission? (y/N): ');
    const eas = easInput.trim().toLowerCase() === 'y';

    rl.close();

    // Run generator
    try {
        await generateApp({
            name,
            url,
            eas,
            outputDir: 'mobile-app',
            // Pass other defaults or options if needed
        });
    } catch (err) {
        console.error('Failed to generate app:', err);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
