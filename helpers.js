const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const { getString } = require('./Localizations/localization.js');
const encrypter = require('crypto-js');

// guildID: locale
exports.guildLocales = {};

// guildID: Directory
exports.directories = {};

exports.millisecondsToHours = function (locale, milliseconds, showMinutes = false, showSeconds = false) {
	var text = getString(locale, "DirectoryBot", "lessThanAnHour");
	if (milliseconds >= 3600000) {
		text = `${Math.floor(milliseconds / 3600000)} ` + getString(locale, "DirectoryBot", "hours");
	}

	if (showMinutes && Math.floor(milliseconds % 3600000 / 60000) > 0) {
		if (text == getString(locale, "DirectoryBot", "lessThanAnHour")) {
			text = `${Math.floor(milliseconds % 3600000 / 60000)} ` + getString(locale, "DirectoryBot", "minutes");
		} else {
			text += ` ${getString(locale, "DirectoryBot", "and")} ${Math.floor(milliseconds % 3600000 / 60000)} ` + getString(locale, "DirectoryBot", "minutes");
		}
	}

	if (showSeconds && Math.floor(milliseconds % 60000 / 1000) > 0) {
		if (text == getString(locale, "DirectoryBot", "lessThanAnHour")) {
			text = `${Math.floor(milliseconds % 60000 / 1000)} ` + getString(locale, "DirectoryBot", "seconds");
		} else {
			text += ` ${getString(locale, "DirectoryBot", "and")} ${Math.floor(milliseconds % 60000 / 1000)} ` + getString(locale, "DirectoryBot", "seconds");
		}
	}

	return text;
}

exports.platformsBuilder = function (guildName, platformsList, locale) {
	let platformTexts = [];
	for (const platform of Object.keys(platformsList)) {
		platformTexts.push(`${platform}${platformsList[platform].roleName ? " " + getString(locale, "DirectoryBot", "platformRole").addVariables({
			"role": platformsList[platform].roleName
		}) : ''}`);
	}

	let listedPlatforms = platformTexts.join(', ');
	return getString(locale, "DirectoryBot", "platformsMessage").addVariables({
		"guild": guildName
	}) + listedPlatforms;
}

exports.versionBuilder = function (avatarURL = '') {
	let data = fs.readFileSync('./ChangeLog.md', 'utf8')
	var dividerRegEx = /####/g;
	var changesStartRegEx = /\.\d+:/g;
	var knownIssuesStartRegEx = /### Known Issues/g;
	var titleStart = dividerRegEx.exec(data).index;
	changesStartRegEx.exec(data);
	var knownIssuesStart = knownIssuesStartRegEx.exec(data).index;
	var knownIssuesEnd = dividerRegEx.exec(data).index;

	var embed = new MessageEmbed().setColor('6b81eb')
		.setAuthor(`Imaginary Horizons Productions`, `https://cdn.discordapp.com/icons/353575133157392385/c78041f52e8d6af98fb16b8eb55b849a.png `, `https://github.com/Imaginary-Horizons-Productions `)
		.setTitle(data.slice(titleStart + 5, changesStartRegEx.lastIndex))
		.setURL(`https://discord.gg/FJ8JGq2`)
		.setThumbnail('https://cdn.discordapp.com/attachments/545684759276421120/734099622846398565/newspaper.png')
		.setFooter(getString("en-US", "DirectoryBot", "footerText"), avatarURL)
		.setTimestamp();

	if (knownIssuesStart < knownIssuesEnd) {
		// Known Issues section found
		embed.setDescription(data.slice(changesStartRegEx.lastIndex, knownIssuesStart))
			.addField(`Known Issues`, data.slice(knownIssuesStart + 16, knownIssuesEnd))
	} else {
		// Known Issues section not found
		embed.setDescription(data.slice(changesStartRegEx.lastIndex, knownIssuesEnd));
	}

	return embed.addField(`Become a Patron`, `Chip in for server costs at the [Imaginary Horizons Productions Patreon](https://www.patreon.com/imaginaryhorizonsproductions)`);
}

exports.saveObject = function (guildID, object, fileName, backup = false) {
	fs.readFile("encryptionKey.txt", 'utf8', (error, keyInput) => {
		if (error) {
			console.log(error);
		} else {
			var filePath = `./`;
			if (backup) {
				filePath += 'backups/' + guildID + '/' + fileName;
				if (!fs.existsSync('./backups')) {
					fs.mkdirSync('./backups');
				}
				if (!fs.existsSync('./backups/' + guildID)) {
					fs.mkdirSync('./backups/' + guildID);
				}
			} else {
				filePath += 'data/' + guildID + '/' + fileName;
				if (!fs.existsSync('./data')) {
					fs.mkdirSync('./data');
				}
				if (!fs.existsSync('./data/' + guildID)) {
					fs.mkdirSync('./data/' + guildID);
				}
			}
			let textToSave = '';
			if (typeof object == 'object' || typeof object == 'number') {
				textToSave = JSON.stringify(object);
			} else {
				textToSave = object;
			}

			fs.writeFile(filePath, encrypter.AES.encrypt(textToSave, keyInput).toString(), 'utf8', (error) => {
				if (error) {
					console.log(error);
				}
			})
		}
	})
}
