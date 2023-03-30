import fs from 'fs';
import path from 'path';
import { databaseConfig, tableConfig, item, databasesEntryConfig, createOrEditConfig, getConfig } from './configsHandlers';

const DATABASES_ENTRY_PATH = path.join(process.cwd(), 'databases');

export default class database {
    name: string;
    tables: string[];

    _databasePath: string;

    /**
     * Creates a new database
     * @param name Name of the database
     * @param tables Tables to be created in the database
     */
    constructor(name: string, tables: string[] = []) {
        this.name = name;
        this._databasePath = path.join(DATABASES_ENTRY_PATH, name);
        this.tables = tables;
        
        this._databasesEntryCheck();
        this._databaseCheck();
        this.tables.forEach(async (table) => {
            try {
                await this.createTable(table);
            } catch (err) {
                throw err;
            }
        })
    }

    _databasesEntryCheck() {
        try {
            if (!fs.existsSync(DATABASES_ENTRY_PATH)) {
                fs.mkdirSync(DATABASES_ENTRY_PATH);
            }

            let config = getConfig(DATABASES_ENTRY_PATH, 'entry') as databasesEntryConfig;
            if (!config) config = { databases: [], type: 'entry' };
            if (!config.databases.includes(this.name)) config.databases.push(this.name);
            createOrEditConfig(DATABASES_ENTRY_PATH, config)
        } catch (err) {
            throw err;
        }
    }

    _databaseCheck() {
        try {
            if (!fs.existsSync(this._databasePath)) {
                fs.mkdirSync(this._databasePath);
            }

            let config = getConfig(this._databasePath, 'database') as databaseConfig;
            if (!config) config = { name: this.name, tables: [], type: 'database' };

            this.tables.map((t) => {
                if (!config.tables.includes(t)) {
                    config.tables.push(t);
                }
            })
            this.tables = config.tables;

            createOrEditConfig(this._databasePath, config);
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    async createTable(tableName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const tablePath = path.join(this._databasePath, tableName);
                
                if(!fs.existsSync(tablePath))
                    fs.mkdirSync(tablePath);

                let config = getConfig(tablePath, 'table') as tableConfig;
                if (!config) config = { name: tableName, lastElementId: 0, type: 'table' };
                createOrEditConfig(tablePath, config);

                resolve();
            } catch (err) {
                reject(err);
            }
        })
    }

    async insert(table: string, item: item) {
        return new Promise((resolve, reject) => {
            try {
                const tablePath = path.join(this._databasePath, table);
                const tableConfig = getConfig(tablePath, 'table') as tableConfig;

                if(!tableConfig) throw new Error('Table does not exist');

                item.id = tableConfig.lastElementId++;

                const itemPath = path.join(tablePath, `${item.id}.json`);
                fs.writeFileSync(itemPath, JSON.stringify(item));
                createOrEditConfig(tablePath, tableConfig);

                resolve(item);
            } catch (err) {
                reject(err);
            }
        })
    }
}

export function getAllDatabases() {

}
