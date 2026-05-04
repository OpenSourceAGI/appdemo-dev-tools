const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateApp(config) {
  // If config is not provided, try to read from config.json (backward compatibility)
  if (!config) {
    console.log('Reading config.json...');
    if (fs.existsSync('config.json')) {
      config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    } else {
      throw new Error('No config provided and config.json not found');
    }
  }

  const appName = config.name;
  const url = config.url;
  // Resolve icon path relative to CWD if provided, otherwise null. 
  // If run from CLI, we might want to allow default icon logic if not provided.
  const iconPath = config.icon ? path.resolve(process.cwd(), config.icon) : null;
  const packageName = config.packageName || 'com.example.app';
  const slug = appName.toLowerCase().replace(/\s+/g, '-');
  // Default to current directory if not provided, consistent with previous behavior
  const outputDir = config.outputDir || '.';

  console.log(`Generating app: ${appName}`);
  console.log(`URL: ${url}`);
  console.log(`Package: ${packageName}`);
  console.log(`Output Directory: ${outputDir}`);

  if (outputDir !== '.' && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const assetsDir = path.join(outputDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  if (iconPath && fs.existsSync(iconPath)) {
    console.log('Processing icons...');

    const iconBuffer = fs.readFileSync(iconPath);

    await sharp(iconBuffer)
      .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('Created assets/icon.png (1024x1024)');

    await sharp(iconBuffer)
      .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('Created assets/adaptive-icon.png (1024x1024)');

    await sharp(iconBuffer)
      .resize(2048, 2048, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(assetsDir, 'splash.png'));
    console.log('Created assets/splash.png (2048x2048)');

    await sharp(iconBuffer)
      .resize(48, 48, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('Created assets/favicon.png (48x48)');
  } else {
    console.log('Icon not found or not provided, creating placeholder icons...');

    const placeholderSvg = Buffer.from(`
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="1024" height="1024" fill="#4630eb"/>
        <text x="512" y="512" font-size="400" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">${appName.charAt(0).toUpperCase()}</text>
      </svg>
    `);

    await sharp(placeholderSvg)
      .resize(1024, 1024)
      .toFile(path.join(assetsDir, 'icon.png'));

    await sharp(placeholderSvg)
      .resize(1024, 1024)
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));

    await sharp(placeholderSvg)
      .resize(2048, 2048)
      .toFile(path.join(assetsDir, 'splash.png'));

    await sharp(placeholderSvg)
      .resize(48, 48)
      .toFile(path.join(assetsDir, 'favicon.png'));

    console.log('Created placeholder icons');
  }

  console.log('Generating App.js...');
  // Use path.join(__dirname, ...) to strictly resolve from the src directory
  let appTemplate = fs.readFileSync(path.join(__dirname, 'App.template.js'), 'utf8');
  appTemplate = appTemplate.replace('__URL__', url);
  fs.writeFileSync(path.join(outputDir, 'App.js'), appTemplate);
  console.log('Created App.js');

  console.log('Generating app.json...');
  let appConfigTemplate = fs.readFileSync(path.join(__dirname, 'app.template.json'), 'utf8');
  appConfigTemplate = appConfigTemplate.replace(/__APP_NAME__/g, appName);
  appConfigTemplate = appConfigTemplate.replace(/__SLUG__/g, slug);
  appConfigTemplate = appConfigTemplate.replace(/__PACKAGE_NAME__/g, packageName);
  fs.writeFileSync(path.join(outputDir, 'app.json'), appConfigTemplate);
  console.log('Created app.json');

  if (config.eas) {
    console.log('Generating eas.json...');
    const easTemplate = fs.readFileSync(path.join(__dirname, 'eas.template.json'), 'utf8');
    fs.writeFileSync(path.join(outputDir, 'eas.json'), easTemplate);
    console.log('Created eas.json');
  }

  console.log('\nApp generation complete!');
  console.log('\nNext steps:');
  console.log(`1. cd ${outputDir}`);
  console.log('2. Run: npm install');
  console.log('3. Run: npm start');
  if (config.eas) {
    console.log('3. To build and auto-submit: eas build --platform all --profile production --auto-submit');
  } else {
    console.log('3. Scan QR code with Expo Go app');
  }
}

// Check if running directly
if (require.main === module) {
  generateApp().catch(err => {
    console.error('Error generating app:', err);
    process.exit(1);
  });
}

module.exports = generateApp;
