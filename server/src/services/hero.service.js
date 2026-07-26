import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../../data/hero.json');

const defaultHeroData = {
  heroBookIds: [],
  heroBooks: [],
  editorPicksBookIds: [],
  editorPicksBooks: [],
  announcementText: 'Welcome to AVELIS — Enjoy 20% Off All Curated Bundling & Physical Archives this Season.'
};

const ensureDataFile = async () => {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.access(DATA_FILE);
  } catch (_) {
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultHeroData, null, 2), 'utf-8');
  }
};

export const getHeroSettings = async () => {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return defaultHeroData;
  }
};

export const saveHeroSettings = async (data) => {
  await ensureDataFile();
  const current = await getHeroSettings();
  const updated = {
    ...current,
    ...data
  };
  await fs.writeFile(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
};
