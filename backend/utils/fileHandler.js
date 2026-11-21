const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

// Serialise writes per file so concurrent requests cannot corrupt the JSON
const writeQueues = {};

const readFile = async (fileName) => {
    const filePath = path.join(DATA_DIR, fileName);
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return data.trim() ? JSON.parse(data) : [];
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        console.error(`Error reading ${fileName}:`, error);
        throw error;
    }
};

const writeFile = (fileName, data) => {
    const filePath = path.join(DATA_DIR, fileName);
    const previous = writeQueues[fileName] || Promise.resolve();
    const next = previous
        .catch(() => {})
        .then(async () => {
            await fs.mkdir(DATA_DIR, { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            return true;
        });
    writeQueues[fileName] = next;
    return next;
};

module.exports = { readFile, writeFile, DATA_DIR };
