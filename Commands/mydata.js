const Command = require('./../Classes/Command.js');
const { getString } = require('./../Localizations/localization.js');
const { MessageEmbed } = require('discord.js');
const { directories } = require('../helpers.js');
const patrons = require('./../patrons.json');

var command = new Command("mydata", false, false, false);

command.execute = (receivedMessage, state, locale) => {
	// Sends the user all the information they've input into the bot
	let embed = new MessageEmbed().setColor('6b81eb')
		.setAuthor(receivedMessage.guild.name, receivedMessage.guild.iconURL())
		.setTitle(getString(locale, command.module, "yourData"))
		.setThumbnail('https://cdn.discordapp.com/attachments/545684759276421120/765064823511318548/gift-of-knowledge.png')
		.setFooter(getString(locale, "DirectoryBot", "footerText"), `https://cdn.discordapp.com/icons/353575133157392385/c78041f52e8d6af98fb16b8eb55b849a.png `)
		.setTimestamp();
	let text = '';
	let dictionary = directories[receivedMessage.guild.id].userDictionary[receivedMessage.author.id];
	Object.keys(dictionary).forEach(platform => {
		text += `\n${platform}: ${dictionary[platform].value ? dictionary[platform].value : ''}`;
	})

	if (patrons.observers.includes(receivedMessage.author.id)) { // Observer
		embed.setImage('https://cdn.discordapp.com/attachments/545684759276421120/734114192013000816/IH_PatreonTierImages_Observer.jpg');
	} else if (patrons.dreamers.includes(receivedMessage.author.id)) { // Dreamer
		embed.setImage('https://cdn.discordapp.com/attachments/545684759276421120/734114186811932713/IH_PatreonTierImages_Dreamer.jpg');
	} else if (patrons.explorers.includes(receivedMessage.author.id)) { // Explorer
		embed.setImage('https://cdn.discordapp.com/attachments/545684759276421120/734114188095651840/IH_PatreonTierImages_Explorer.jpg');
	} else if (patrons.cartographers.includes(receivedMessage.author.id)) { // Cartographer
		embed.setImage('https://cdn.discordapp.com/attachments/545684759276421120/734114184685420615/IH_PatreonTierImages_Cartographer_.jpg');
	} else if (patrons.archivists.includes(receivedMessage.author.id)) { // Archivist
		embed.setImage('https://cdn.discordapp.com/attachments/545684759276421120/734114183620067358/IH_PatreonTierImages_Archivist.jpg');
	} else if (patrons.grandArchivists.includes(receivedMessage.author.id)) { // Grand Archivist
		embed.setImage('https://cdn.discordapp.com/attachments/545684759276421120/734114189710327818/IH_PatreonTierImages_Grand_Archivist.jpg');
	}

	if (text.length < 2049) {
		embed.setDescription(text);
		receivedMessage.author.send(embed)
			.catch(console.error);
	} else {
		// Error Message
		receivedMessage.author.send(getString(locale, command.module, "errorMessageOverflow").addVariables({
			"alias": state.command
		})).catch(console.error);
	}
}

module.exports = command;
