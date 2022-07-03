/* Dependencies */
import cron from 'node-cron';
import {Guild, GuildMember} from "discord.js";

/* Extras */
import roles from "../../Extras/roles";
import config from "../../Extras/config";
import { client } from "../..";

/* Helpers */
import {logInfo, logOk, logWarn} from "../../Helpers/Logger";

/* Variable */
const guild: Guild = client.guilds.cache.get(config.discordGuildID);

/* Function */
async function processCron() {
    // Get all members on guild.
    const discordMembers: Array<GuildMember> = (await guild.members.fetch()).array();
    logInfo(`Processing ${discordMembers.length} discord user(s).`, "Purger->processCron");

    //* Kick any members that don't have subscribed role and also a whitelisted roles.
    for (const index in discordMembers) {
        const member: GuildMember = discordMembers[index];

        // If this member is a bot. Don't do anything.
        if (member.user.bot) {
            continue;
        }

        // If member has a subscribed role, Don't do anything.
        if (member.roles.cache.has(roles.subscriber.id)) {
            continue;
        }

        // Get this member roles.
        const memberRoles = member.roles.cache.array();

        // If this member is whitelisted. Don't do anything.
        if (
            memberRoles.some(role =>
                role.id === roles.slave.id ||
                role.id === roles.admin.id ||
                role.id === roles.vvip.id ||
                role.id === roles.moderator.id
            )
        ) {
            continue;
        }

        // If this member is not whitelisted, Kick him.
        if (!member.kickable) {
            logWarn(`Can't kick this member. (${member.id})`, "Purger->processCron");
            continue;
        }

        await member.kick("Automated Purge (Don't have subscription & whitelist roles)");
    }

    logOk('Processed all discord user(s)','Purger->processCron');
}

/* Interval */
cron.schedule('*/30 * * * *', processCron);