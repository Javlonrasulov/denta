const path = require('path');
const fs = require('fs');

/**
 * Dual Android Studio projects live outside the default ./android folder:
 *   android-client → uz.denta.client
 *   android-doctor → uz.denta.doctor
 *
 * React Native / Expo autolinking need an explicit sourceDir + packageName
 * when APP_VARIANT is set, or when only one of those folders exists.
 */
function resolveAndroidProject() {
  const variant = process.env.APP_VARIANT;
  const map = {
    client: {
      sourceDir: './android-client',
      packageName: 'uz.denta.client',
    },
    doctor: {
      sourceDir: './android-doctor',
      packageName: 'uz.denta.doctor',
    },
    clinic: {
      sourceDir: './android',
      packageName: 'uz.denta.clinic',
    },
  };

  if (variant && map[variant]) {
    return map[variant];
  }

  if (fs.existsSync(path.join(__dirname, 'android', 'settings.gradle'))) {
    return map.clinic;
  }
  if (fs.existsSync(path.join(__dirname, 'android-client', 'settings.gradle'))) {
    return map.client;
  }
  if (fs.existsSync(path.join(__dirname, 'android-doctor', 'settings.gradle'))) {
    return map.doctor;
  }

  return map.client;
}

module.exports = {
  project: {
    android: resolveAndroidProject(),
  },
};
