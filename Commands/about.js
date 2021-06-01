const Command = require('../Classes/Command.js');
const { getString } = require('../Localizations/localization.js');
const { MessageEmbed } = require('discord.js');

var command = new Command("about", false, false, true);

// Overwrite detailed help description with executing the command
command.help = (avatarURL, guildID, locale, guildName, module) => {
	return creditsBuilder(avatarURL, locale);
}

command.execute = (receivedMessage, state, locale) => {
	// Displays the credits
	receivedMessage.author.send(creditsBuilder(receivedMessage.client.user.avatarURL(), locale))
		.catch(console.error);
}

module.exports = command;

function creditsBuilder(footerURL, locale) {
	return new MessageEmbed().setColor(`6b81eb`)
		.setAuthor("Imaginary Horizons Productions", `https://cdn.discordapp.com/icons/353575133157392385/c78041f52e8d6af98fb16b8eb55b849a.png `, `https://discord.gg/FJ8JGq2`)
		.setTitle(getString(locale, command.module, "creditsTitle"))
		.setThumbnail('https://cdn.discordapp.com/attachments/545684759276421120/734097014974971924/theater-curtains.png')
		.setURL(`https://github.com/Imaginary-Horizons-Productions/DirectoryBot `)
		.addField(getString(locale, command.module, "designAndEngineering"), `Nathaniel Tseng ( <@106122478715150336> | [Twitter](https://twitter.com/Archainis) )`)
		.addField(getString(locale, command.module, "engineering"), `Lucas Ensign ( <@112785244733628416> | [Twitter](https://twitter.com/SillySalamndr) )`)
		.addField(getString(locale, command.module, "art"), `Angela Lee ( [Website](https://www.angelasylee.com/) )`)
		.addField(getString(locale, command.module, "localization"), `Mnemmy (fr), towoko (de), Lille (de)`)
		.addField(`Embed Thumbnails`, `[game-icons.net](https://game-icons.net/)`)
		.addField(`\u200B`, getString(locale, command.module, "patronsDescription"))
		.addField(getString(locale, command.module, "archivistTier"), "Victor Huang", false)
		.addField(getString(locale, command.module, "cartographerTier"), `Ralph Beish`, false)
		.addField(getString(locale, command.module, "explorerTier"), `Eric Hu`, false)
		.setFooter(getString(locale, "DirectoryBot", "footerText"), footerURL)
		.setTimestamp();
}
