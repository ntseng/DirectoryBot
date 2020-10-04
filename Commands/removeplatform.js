const Command = require('./../Classes/Command.js');
const { getString } = require('./../Localizations/localization.js');
const { directories, saveObject } = require('./../helpers.js');

var command = new Command("removeplatform", true, false, false);

command.execute = (receivedMessage, state, locale) => {
	// Removes the given platform
	if (state.messageArray.length > 0) {
		let platform = state.messageArray[0].toLowerCase();

		if (directories[receivedMessage.guild.id].platformsList[platform]) {
			Object.keys(directories[receivedMessage.guild.id].userDictionary).forEach(userID => {
				if (directories[receivedMessage.guild.id].platformsList[platform].roleID) {
					receivedMessage.guild.members.resolve(userID).roles.remove(directories[receivedMessage.guild.id].platformsList[platform].roleID);
				}
				delete directories[receivedMessage.guild.id].userDictionary[userID][platform];
			})
			delete directories[receivedMessage.guild.id].platformsList[platform];
			receivedMessage.channel.send(getString(locale, command.module, "successMessage").addVariables({
				"platform": platform
			})).catch(console.error);
			saveObject(receivedMessage.guild.id, directories[receivedMessage.guild.id].platformsList, 'platformsList.txt');
		} else {
			// Error Message
			receivedMessage.author.send(getString(locale, command.module, "errorBadPlatform").addVariables({
				"platform": platform,
				"server": receivedMessage.guild.name
			})).catch(console.error);
		}
	} else {
		// Error Message
		receivedMessage.author.send(getString(locale, command.module, "errorNoPlatform"))
			.catch(console.error);
	}
}

module.exports = command;
