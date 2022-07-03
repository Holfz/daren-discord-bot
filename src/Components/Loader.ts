/* Dependencies */
import Discord from "discord.js";
import fs from "fs";
import path from "path";

/* Helpers */
import { logInfo, logError } from "../Helpers/Logger";

/* Variable */
let moduleFolder: fs.PathLike = path.resolve("./dist/Modules");

/* Exports */
export default async (client: Discord.Client) => {
	loadModules(client);
	loadEvents(path.resolve(`./dist/Events`), client);
};

/**
 * Load modules in the modules folder
 * @param {client} client
*/
async function loadModules(client: Discord.Client) {
    let modules = fs.readdirSync(moduleFolder);

    modules = modules.filter(module => {
        if (
            fs.existsSync(`${moduleFolder}/${module}/config.json`) &&
			typeof require(`${moduleFolder}/${module}/config.json`).enabled !== "undefined"
		) {
            return require(`${moduleFolder}/${module}/config.json`).enabled;
        }

        if (
            fs.existsSync(`${moduleFolder}/${module}/config.json`) &&
            require(`${moduleFolder}/${module}/config.json`).prodOnly == true && process.env.NODE_ENV !== 'production'
		) {
            return false;
        }

		return true;
    });
    
    let commandCount = await Promise.all(
        modules.map(async module => {
			if (fs.existsSync(`${moduleFolder}/${module}/commands`))
            return fs.readdirSync(`${moduleFolder}/${module}/commands`).filter(f => {
                if (f.endsWith(".ts") || f.endsWith(".map")) return false;
                let props = require(`${moduleFolder}/${module}/commands/${f}`);
                return (typeof props["config"].enabled !== "undefined") ? props["config"].enabled : true;
            });
        })
    ).then(cmds => {
        // @ts-ignore
        return [].concat(...cmds).filter(f => f).length;
    });
    
    let eventCount = await Promise.all(
		modules.map(async module => {
			if (fs.existsSync(`${moduleFolder}/${module}/events`))
            return fs.readdirSync(`${moduleFolder}/${module}/events`).filter(f => {
                if (f.endsWith(".ts") || f.endsWith(".map")) return false;
                let props = require(`${moduleFolder}/${module}/events/${f}`);
                return (typeof props == "function" || typeof props.config != "undefined") ? true : true;
            });
		})
	).then(events => {
		// @ts-ignore
		return [].concat(...events).filter(f => f).length;
	});

    logInfo(`Loading : ${modules.length} module${modules.length > 1 ? "" : "s"} | ${commandCount} command${commandCount > 1 ? "" : "s"} | ${eventCount} event${commandCount > 1 ? "" : "s"}`, 'Loader');

    modules.map(async module => {
		if (fs.existsSync(`${moduleFolder}/${module}/commands`)) {
            loadCommands(`${moduleFolder}/${module}/commands`, client);
        }
        
        if (fs.existsSync(`${moduleFolder}/${module}/events`)) {
            loadEvents(`${moduleFolder}/${module}/events`, client);
        }

		client.once("ready", async () => {
            if (!fs.existsSync(`${moduleFolder}/${module}/Index.js`)) { return; }
            
            logInfo(`(Module) ${module} Loaded.`, "Loader");
            require(`${moduleFolder}/${module}/Index.js`);
		});
	});
}

/**
 * Load all commands in the given folder
 * @param {string} filePath Path to folder with command files
 * @param {client} client Client which will be used to save the command
*/
async function loadCommands(filePath: string, client: Discord.Client) {
    let files = fs.readdirSync(filePath);
    files = files.filter(file => (!file.endsWith(".ts") && !file.endsWith(".map")));
    files = files.map(file => file.split(".")[0]);
    
    files.map(command => {
		let props = require(`${filePath}/${command}`);
		if (typeof props["config"] == "undefined") {
			return logError(`Command ${command} in module ${path.basename(path.dirname(filePath))} is missing required field config`, "Loader");
		}

		if (typeof props.config.name == "undefined") {
			return logError(`Command ${command} in module ${path.basename(path.dirname(filePath))} is missing required property name`, "Loader");
		}

		if (typeof props.config.enabled != "undefined" && !props.config.enabled) { return; }

		client.commands.set(props.config.name, props);
		//* Only add aliases if there are any
		if (typeof props.config.aliases != "undefined") {
			props.config.aliases.forEach((alias: string) => {
				client.aliases.set(alias, props.config.name);
			});
        }

        logInfo(`(Command) ${command} Loaded.`, "Loader");
	});
}

/**
 * Load all events in the given folder
 * @param {string} filePath Path to folder with event files
 * @param {client} client Client which will be used to bind the event
*/
async function loadEvents(filePath: string, client: Discord.Client) {
	let eventFile: any,
        files = fs.readdirSync(filePath);

    files = files.filter(file => !file.endsWith(".ts") && !file.endsWith(".map"));
	files = files.map(file => file.split(".")[0]);

	files.map((event: any) => {
		eventFile = require(`${filePath}/${event}.js`);
        if (typeof eventFile == "function") {
            client.on(event, eventFile);
            logInfo(`(Event) ${event} Loaded.`, "Loader");
		} else {
			if (typeof eventFile.config == "undefined") {
				return logError(`Event ${event} in module ${path.basename(path.dirname(filePath))} is missing required field config`);
			}

			if (typeof eventFile.config.clientOnly != "undefined") {
				client.on(event, () => eventFile.run(client));
            }
		}
	});
}