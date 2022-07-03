/* Dependencies */
import * as Discord from "discord.js";
import { config } from "dotenv";
import "source-map-support/register";

/* Environments */
config();

/* Components */
import Loader from "./Components/Loader";

/* Extras */
import roles from "./Extras/roles";

/* Discord */
export let client = new Discord.Client({
    presence: process.env.NODE_ENV == "development" ? {
        status: "dnd",
        activity: {
            name: "@holfz#4848 code",
            type: "WATCHING"
        }
    } : {
        status: "online",
        activity: {
            name: "\"House of Daren\"",
            type: "WATCHING"
        }
    }
});

/* Collection */
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();

/* Shared Function */
client.elevation = (userId: string) => {
	//* Permission level checker
	let permlvl: Number = 0;

	const member = client.guilds.cache.first().members.cache.get(userId);
	if (!member) return 0;

	if (member.roles.cache.has(roles.subscriber.id)) {
		permlvl = 1;
    }

    // Moderator
    if (member.roles.cache.has(roles.moderator.id)) {
        permlvl = 2;
    }

    // VVIP
    if (member.roles.cache.has(roles.vvip.id)) {
        permlvl = 3;
    }

    // Admin
	if (member.roles.cache.has(roles.admin.id)) {
		permlvl = 4;
    }

	//* ADMINISTRATOR
	if (
        member.roles.cache.has(roles.slave.id) || member.permissions.has("ADMINISTRATOR")
	) {
		permlvl = 5;
    }

	//* Return level.
	return permlvl;
};

/* Initialize */
client.login(process.env.TOKEN).then(async () => Loader(client));