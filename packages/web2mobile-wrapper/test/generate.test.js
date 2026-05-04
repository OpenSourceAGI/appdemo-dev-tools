const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const generateApp = require('../src/generate');

jest.mock('fs');
jest.mock('sharp');

describe('generateApp', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('template')) {
                return 'TEMPLATE_CONTENT';
            }
            return '';
        });
        // Mock sharp chainable methods
        sharp.mockReturnValue({
            resize: jest.fn().mockReturnThis(),
            toFile: jest.fn().mockResolvedValue(true),
        });
    });

    it('should generate app files in the specified output directory', async () => {
        const config = {
            name: 'Test App',
            url: 'https://example.com',
            outputDir: 'test-output',
        };

        await generateApp(config);

        // Verify directory creation
        expect(fs.mkdirSync).toHaveBeenCalledWith('test-output', { recursive: true });
        expect(fs.mkdirSync).toHaveBeenCalledWith(path.join('test-output', 'assets'), { recursive: true });

        // Verify file writes
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            path.join('test-output', 'App.js'),
            expect.stringContaining('TEMPLATE_CONTENT')
        );
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            path.join('test-output', 'app.json'),
            expect.stringContaining('TEMPLATE_CONTENT')
        );
    });

    it('should generate eas.json if eas config is true', async () => {
        const config = {
            name: 'Test App',
            url: 'https://example.com',
            outputDir: 'test-output',
            eas: true,
        };

        await generateApp(config);

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            path.join('test-output', 'eas.json'),
            expect.stringContaining('TEMPLATE_CONTENT')
        );
    });
});
