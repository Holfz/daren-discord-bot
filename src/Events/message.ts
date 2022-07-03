/* Dependencies */
import { Message } from "discord.js";

/* Extras */
import config from "../Extras/config";

/* Event Exports */
module.exports = async (message: Message) => {
    //* Message is not command
    if (!message.content.startsWith(config.prefix)) return;
    
    //* Prevent bots
    if (message.author?.bot) return;
    
    let command = message.content.split(" ")[0].slice(config.prefix.length),
        params = message.content.split(" ").slice(1),
        perms = message.client.elevation(message.author.id),
        cmd: any;

    //* .cache.get current command from commands/aliases
    if (message.client.commands.has(command))
        cmd = message.client.commands.get(command);
    else if (message.client.aliases.has(command)) {
        cmd = message.client.commands.get(message.client.aliases.get(command));
    }

    if (!cmd) {
        await message.react("❌");
        await message.delete({ timeout: 5 * 1000 });

        return;
    }

    if (typeof cmd.config.permLevel != "undefined" && perms < cmd.config.permLevel) {
        await message.react("❌");
        return message.channel.send({
            embed: {
                description: "You do not have permission to run this command!",
                color: "#F08080",
                footer: { text: message.author.tag }
            }
        });
    }

    cmd.run(message, params, perms);
}