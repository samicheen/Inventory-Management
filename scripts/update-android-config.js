const fs = require('fs');
const path = require('path');

// Read capacitor.config.json
const configPath = path.join(__dirname, '../capacitor.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Read variables.gradle
const variablesGradlePath = path.join(__dirname, '../android/variables.gradle');
if (!fs.existsSync(variablesGradlePath)) {
  console.log('Android folder does not exist yet. Run "npx cap add android" first.');
  process.exit(0);
}

let variablesGradle = fs.readFileSync(variablesGradlePath, 'utf8');

// Update minSdkVersion if specified in config
if (config.android && config.android.minSdkVersion) {
  const minSdkVersion = config.android.minSdkVersion;
  // Replace the minSdkVersion line
  variablesGradle = variablesGradle.replace(
    /minSdkVersion = \d+/,
    `minSdkVersion = ${minSdkVersion}`
  );
  
  // Write back to file
  fs.writeFileSync(variablesGradlePath, variablesGradle, 'utf8');
  console.log(`✅ Updated minSdkVersion to ${minSdkVersion} in variables.gradle`);
} else {
  console.log('No Android minSdkVersion specified in capacitor.config.json');
}

