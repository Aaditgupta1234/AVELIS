import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../../data/bundles.json');

const defaultBundles = [
  {
    id: 'c1',
    title: 'Modern Classics',
    subtitle: 'Featured Series',
    description: "Revisiting the 20th century's most profound literary achievements.",
    volumes: '42 Volumes',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2228&auto=format&fit=crop',
    bookIds: []
  },
  {
    id: 'c2',
    title: 'Business Strategy',
    subtitle: 'The Vault',
    description: 'The fundamental theories that shaped the modern economic landscape.',
    volumes: '28 Volumes',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2190&auto=format&fit=crop',
    bookIds: []
  },
  {
    id: 'c3',
    title: 'Artificial Intelligence',
    subtitle: 'Emergent Tech',
    description: 'Understanding the evolution of digital consciousness and ethics.',
    volumes: '15 Volumes',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop',
    bookIds: []
  }
];

const ensureDataFile = async () => {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.access(DATA_FILE);
  } catch (_) {
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultBundles, null, 2), 'utf-8');
  }
};

export const getBundles = async () => {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return defaultBundles;
  }
};

export const saveBundles = async (bundles) => {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(bundles, null, 2), 'utf-8');
  return bundles;
};

export const createBundle = async (bundleData) => {
  const bundles = await getBundles();
  const newBundle = {
    id: `bundle-${Date.now()}`,
    title: bundleData.title,
    subtitle: bundleData.subtitle || 'Curated Collection',
    description: bundleData.description,
    volumes: bundleData.volumes || `${bundleData.bookIds?.length || 3} Volumes Set`,
    price: Number(bundleData.price || 49.99),
    image: bundleData.image || 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2190&auto=format&fit=crop',
    bookIds: bundleData.bookIds || []
  };

  const updated = [newBundle, ...bundles];
  await saveBundles(updated);
  return newBundle;
};

export const updateBundle = async (id, bundleData) => {
  const bundles = await getBundles();
  let updatedItem = null;

  const updated = bundles.map((b) => {
    if (b.id === id) {
      updatedItem = {
        ...b,
        ...bundleData,
        price: Number(bundleData.price ?? b.price)
      };
      return updatedItem;
    }
    return b;
  });

  if (!updatedItem) {
    throw new Error('Bundle not found');
  }

  await saveBundles(updated);
  return updatedItem;
};

export const deleteBundle = async (id) => {
  const bundles = await getBundles();
  const updated = bundles.filter((b) => b.id !== id);
  await saveBundles(updated);
  return { success: true, id };
};
