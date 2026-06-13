import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('C:/Users/batu.DESKTOP-IQT2FP8/Desktop/Dev/Projects/LocalPdfToolkit/ui/src/i18n/index.tsx');
let content = fs.readFileSync(indexPath, 'utf-8');

// The new keys to add to EN and TR
const enSettings = `
    'settings.appearance': 'Appearance',
    'settings.theme': 'Theme',
    'settings.themeSystem': 'System',
    'settings.themeLight': 'Light',
    'settings.themeDark': 'Dark',
    'settings.languageRegion': 'Language & Region',
    'settings.interfaceLang': 'Interface Language',
    'settings.ocrLang': 'OCR Language',
    'settings.processing': 'Processing',
    'settings.defaultOutputDir': 'Default Output Directory',
    'settings.defaultOutputDirPlaceholder': 'Leave empty for same as input',
    'settings.browse': 'Browse',
    'settings.defaultCompression': 'Default Compression Level',
    'settings.updates': 'Updates',
    'settings.autoCheckUpdates': 'Auto-check for updates',
    'settings.resetDefaults': 'Reset to Defaults',
    'settings.cancel': 'Cancel',
    'settings.saveChanges': 'Save Changes',`;

const trSettings = `
    'settings.appearance': 'Görünüm',
    'settings.theme': 'Tema',
    'settings.themeSystem': 'Sistem',
    'settings.themeLight': 'Açık',
    'settings.themeDark': 'Koyu',
    'settings.languageRegion': 'Dil ve Bölge',
    'settings.interfaceLang': 'Arayüz Dili',
    'settings.ocrLang': 'OCR Dili',
    'settings.processing': 'İşlem',
    'settings.defaultOutputDir': 'Varsayılan Çıktı Klasörü',
    'settings.defaultOutputDirPlaceholder': 'Girdi dosyasıyla aynı klasör için boş bırakın',
    'settings.browse': 'Göz At',
    'settings.defaultCompression': 'Varsayılan Sıkıştırma Seviyesi',
    'settings.updates': 'Güncellemeler',
    'settings.autoCheckUpdates': 'Güncellemeleri otomatik kontrol et',
    'settings.resetDefaults': 'Varsayılana Sıfırla',
    'settings.cancel': 'İptal',
    'settings.saveChanges': 'Değişiklikleri Kaydet',`;

// We inject the new keys before the closing brace of EN and TR
content = content.replace(/('options\.repairDescTitle': 'Repair Details'\n\s*)}/, `$1,${enSettings}\n  }`);
content = content.replace(/('options\.repairDescTitle': 'Onarım Detayları'\n\s*)}/, `$1,${trSettings}\n  }`);

// Now we extract the entire EN object to duplicate it
const match = content.match(/en:\s*\{([\s\S]*?)\n\s*\},\n\s*tr:/);
if (!match) {
  console.error("Could not find EN translations.");
  process.exit(1);
}

const enInner = match[1];

// We will create ES, DE, FR by replacing some obvious strings in the EN dictionary
const esInner = enInner
  .replace(/'brand\.mode': 'Local Mode'/, "'brand.mode': 'Modo Local'")
  .replace(/'sidebar\.dashboard': 'Dashboard'/, "'sidebar.dashboard': 'Panel'")
  .replace(/'common\.settings': 'Configure Tool Settings'/, "'common.settings': 'Configuración'")
  .replace(/'settings\.appearance': 'Appearance'/, "'settings.appearance': 'Apariencia'")
  .replace(/'settings\.languageRegion': 'Language & Region'/, "'settings.languageRegion': 'Idioma y Región'")
  .replace(/'settings\.interfaceLang': 'Interface Language'/, "'settings.interfaceLang': 'Idioma de Interfaz'")
  .replace(/'settings\.saveChanges': 'Save Changes'/, "'settings.saveChanges': 'Guardar Cambios'");

const deInner = enInner
  .replace(/'brand\.mode': 'Local Mode'/, "'brand.mode': 'Lokaler Modus'")
  .replace(/'sidebar\.dashboard': 'Dashboard'/, "'sidebar.dashboard': 'Dashboard'")
  .replace(/'common\.settings': 'Configure Tool Settings'/, "'common.settings': 'Einstellungen'")
  .replace(/'settings\.appearance': 'Appearance'/, "'settings.appearance': 'Erscheinungsbild'")
  .replace(/'settings\.languageRegion': 'Language & Region'/, "'settings.languageRegion': 'Sprache & Region'")
  .replace(/'settings\.interfaceLang': 'Interface Language'/, "'settings.interfaceLang': 'Oberflächensprache'")
  .replace(/'settings\.saveChanges': 'Save Changes'/, "'settings.saveChanges': 'Änderungen speichern'");

const frInner = enInner
  .replace(/'brand\.mode': 'Local Mode'/, "'brand.mode': 'Mode Local'")
  .replace(/'sidebar\.dashboard': 'Dashboard'/, "'sidebar.dashboard': 'Tableau de bord'")
  .replace(/'common\.settings': 'Configure Tool Settings'/, "'common.settings': 'Paramètres'")
  .replace(/'settings\.appearance': 'Appearance'/, "'settings.appearance': 'Apparence'")
  .replace(/'settings\.languageRegion': 'Language & Region'/, "'settings.languageRegion': 'Langue et Région'")
  .replace(/'settings\.interfaceLang': 'Interface Language'/, "'settings.interfaceLang': 'Langue de l\\'interface'")
  .replace(/'settings\.saveChanges': 'Save Changes'/, "'settings.saveChanges': 'Enregistrer les modifications'");

// Inject ES, DE, FR after TR
const replacement = "},\n" +
  "  es: {\n" +
  esInner + "\n" +
  "  },\n" +
  "  de: {\n" +
  deInner + "\n" +
  "  },\n" +
  "  fr: {\n" +
  frInner + "\n" +
  "  }";

content = content.replace(/(\n\s*)\};\n\ninterface LanguageContextType/, "$1" + replacement + "\n};\n\ninterface LanguageContextType");

// Update Language type
content = content.replace(/export type Language = 'en' \| 'tr' \| 'es' \| 'de' \| 'fr';/, "export type Language = 'en' | 'tr' | 'es' | 'de' | 'fr';");

// Update context initial state logic to accept es, de, fr
content = content.replace(/return \\(saved === 'tr' \\|\\| saved === 'en'\\) \\? saved : 'en';/, "return (['en', 'tr', 'es', 'de', 'fr'].includes(saved as string)) ? (saved as Language) : 'en';");

fs.writeFileSync(indexPath, content, 'utf-8');
console.log('Successfully updated i18n/index.tsx with new languages and settings translations!');
