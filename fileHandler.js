const fs = require('fs').promises;
const path = require('path');

const readFile = async (fileName) => {
    try {
        const filePath = path.join(__dirname, '../data', fileName);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${fileName}:`, error);
        return [];
    }
};

const writeFile = async (fileName, data) => {
    try {
        const filePath = path.join(__dirname, '../data', fileName);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing to ${fileName}:`, error);
        return false;
    }
};

module.exports = { readFile, writeFile };
