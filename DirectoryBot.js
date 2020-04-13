const Discord = require('discord.js');
Discord.MessageEmbed.prototype.addBlankField = function (inline = false) {
    return this.addField('\u200B', '\u200B', inline);
}
const fs = require('fs');
var encrypter = require('crypto-js');
var chrono = require('chrono-node');
var timeModule = require('./DirectoryBot_TimeModule.js');
var streamModule = require('./DirectoryBot_StreamModule.js');
var helpers = require('./DirectoryBot_Helpers.js');

const client = new Discord.Client();

class GuildSpecifics {
    constructor(userDictionaryInput = {}, platformsListInput = {
        "possessivepronoun": new PlatformData("setting", "The user's possessive pronoun, for use in bot messaging."),
        "timezone": new PlatformData("default", "The user's time zone, for use in time conversions."),
        "stream": new PlatformData(undefined, "The user's stream username. Currently supported: Twitch")
    }, opRoleInput = "", infoLifetimeInput = 3600000) {
        this.userDictionary = userDictionaryInput;
        this.platformsList = platformsListInput;
        this.opRole = opRoleInput;
        this.infoLifetime = infoLifetimeInput;
    }
}

class FriendCode {
    constructor(input = null) {
        this.value = input;
        this.id;
    }
}

class PlatformData {
    //TODO have multiple entries per platform
    constructor(termInput = "username", descriptionInput = "") {
        this.term = termInput;
        this.description = descriptionInput;
        this.role;
    }
}


var helpOverloads = ["help", "commands"];
var convertOverloads = ["convert"];
var countdownOverloads = ["countdown"];
var multistreamOverloads = ["multistream", "multitwitch"];
var recordOverloads = ["record", "log"];
var sendOverloads = ["send", "tell"];
var lookupOverloads = ["lookup"];
var streamshoutoutOverloads = ["shoutout", "streamshoutout"];
var whoisOverloads = ["whois"];
var deleteOverloads = ["delete", "remove", "clear"];
var platformsOverloads = ["platforms"];
var supportOverloads = ["support"];
var creditsOverloads = ["credits", "creditz", "about"];
var setoproleOverloads = ["setoprole"];
var newplatformOverloads = ["newplatform", "addplatform"];
var changeplatformtermOverloads = ["changeplatformterm", "setplatformterm"];
var removeplatformOverloads = ["removeplatform"];
var setplatformroleOverloads = ["setplatformrole"];

var participatingGuildsIDs = [];
var guildDictionary = {};

var antiSpam = [];
var commandLimit = 3;
var antiSpamInterval = 5000;

login();

client.on('ready', () => {
    console.log("Connected as " + client.user.tag + "\n");
    fs.readFile("encryptionKey.txt", 'utf8', (error, keyInput) => {
        if (error) {
            console.log(error);
        } else {
            participatingGuildsIDs.forEach(guildID => {
                var guild = client.guilds.resolve(guildID);
                if (guild) {
                    var newGuild = true;
                    guildDictionary[guildID] = new GuildSpecifics();

                    fs.readFile(`./data/${guildID}/opRole.txt`, 'utf8', (error, opRoleInput) => {
                        if (error) {
                            console.log(error);
                        } else {
                            guildDictionary[guildID].opRole = encrypter.AES.decrypt(opRoleInput, keyInput).toString(encrypter.enc.Utf8);
                            newGuild = false;
                        }

                        fs.readFile(`./data/${guildID}/userDictionary.txt`, 'utf8', (error, userDictionaryInput) => {
                            if (error) {
                                console.log(error);
                            } else {
                                Object.assign(guildDictionary[guildID].userDictionary, JSON.parse(encrypter.AES.decrypt(userDictionaryInput, keyInput).toString(encrypter.enc.Utf8)));
                                newGuild = false;
                            }

                            fs.readFile(`./data/${guildID}/platformsList.txt`, 'utf8', (error, platformsListInput) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    Object.assign(guildDictionary[guildID].platformsList, JSON.parse(encrypter.AES.decrypt(platformsListInput, keyInput).toString(encrypter.enc.Utf8)));
                                    newGuild = false;
                                }

                                if (newGuild) {
                                    saveOpRole(guildID);
                                    savePlatformsList(guildID);
                                    saveUserDictionary(guildID);
                                }

                                setInterval(() => {
                                    saveParticipatingGuildsIDs(true);
                                    Object.keys(guildDictionary).forEach((guildID) => {
                                        saveOpRole(guildID, true);
                                        savePlatformsList(guildID, true);
                                        saveUserDictionary(guildID, true);
                                    })
                                }, 3600000)
                            });
                        });
                    });
                    console.log("Connected to: " + guild.toString());
                } else {
                    guildDelete(guildID);
                }
            })
        }
    })

    client.user.setActivity(`@DirectoryBot help`, { type: "LISTENING" }).catch(console.error);
})

client.on('message', (receivedMessage) => {
    if (receivedMessage.author == client.user || !receivedMessage.guild) {
        return;
    }

    if (receivedMessage.mentions.users.has(client.user.id)) {
        if (!participatingGuildsIDs.includes(receivedMessage.guild.id)) {
            guildCreate(receivedMessage.guild.id);
        }

        var splitMessage = receivedMessage.content.split(" ");
        if (splitMessage[0].replace(/\D/g, "") == client.user.id) {
            var recentInteractions = 0;

            antiSpam.forEach(user => {
                if (user == receivedMessage.author.id) {
                    recentInteractions++;
                }
            })

            if (recentInteractions < commandLimit) {
                var messageArray = splitMessage.filter(function (element) {
                    return element != "";
                });
                messageArray = messageArray.slice(1); // Discard bot mention
                var arguments = {
                    "command": messageArray[0], // The primary command
                    "guildMemberMentions": [],
                    "roleMentions": [],
                    "words": [] // All other non-command words
                };
                messageArray = messageArray.slice(1); // Discard (already stored) command
                for (var i = 0; i < messageArray.length; i += 1) {
                    if (messageArray[i].match(Discord.MessageMentions.USERS_PATTERN)) {
                        arguments["guildMemberMentions"].push(receivedMessage.guild.members.resolve(messageArray[i].replace(/\D/g, '')));
                    } else if (messageArray[i].match(Discord.MessageMentions.ROLES_PATTERN)) {
                        arguments["roleMentions"].push(receivedMessage.guild.roles.resolve(messageArray[i].replace(/\D/g, '')));
                    } else {
                        arguments["words"].push(messageArray[i]);
                    }
                }

                if (arguments["command"]) {
                    if (!guildDictionary[receivedMessage.guild.id].userDictionary[receivedMessage.author.id]) {
                        guildDictionary[receivedMessage.guild.id].userDictionary[receivedMessage.author.id] = {};
                        Object.keys(guildDictionary[receivedMessage.guild.id].platformsList).forEach((platformInList) => {
                            guildDictionary[receivedMessage.guild.id].userDictionary[receivedMessage.author.id][platformInList] = new FriendCode();
                        });
                    }

                    if (helpOverloads.includes(arguments["command"])) {
                        helpCommand(arguments, receivedMessage);
                    } else if (convertOverloads.includes(arguments["command"])) {
                        timeModule.convertCommand(arguments, receivedMessage, guildDictionary[receivedMessage.guild.id].userDictionary);
                    } else if (countdownOverloads.includes(arguments["command"])) {
                        timeModule.countdownCommand(arguments, receivedMessage, guildDictionary[receivedMessage.guild.id].userDictionary);
                    } else if (multistreamOverloads.includes(arguments["command"])) {
                        if (Object.keys(guildDictionary[receivedMessage.guild.id].platformsList).includes("stream")) {
                            streamModule.multistreamCommand(arguments, receivedMessage, guildDictionary[receivedMessage.guild.id].userDictionary);
                        } else {
                            // Error Message
                            receivedMessage.author.send(`Your multistream command could not be completed. ${receivedMessage.guild} does not seem to be tracking stream information.`);
                        }
                    } else if (streamshoutoutOverloads.includes(arguments["command"])) {
                        console.log(Object.keys(guildDictionary[receivedMessage.guild.id].platformsList));
                        if (Object.keys(guildDictionary[receivedMessage.guild.id].platformsList).includes("stream")) {
                            streamModule.streamShoutoutCommand(arguments, receivedMessage, guildDictionary[receivedMessage.guild.id].userDictionary)
                        } else {
                            // Error Message
                            receivedMessage.author.send(`Your shoutout command could not be completed. ${receivedMessage.guild} does not seem to be tracking stream information.`);
                        }
                    } else if (recordOverloads.includes(arguments["command"])) {
                        recordCommand(arguments, receivedMessage);
                        receivedMessage.delete();
                    } else if (lookupOverloads.includes(arguments["command"])) {
                        lookupCommand(arguments, receivedMessage);
                    } else if (sendOverloads.includes(arguments["command"])) {
                        sendCommand(arguments, receivedMessage);
                    } else if (whoisOverloads.includes(arguments["command"])) {
                        whoisCommand(arguments, receivedMessage);
                    } else if (deleteOverloads.includes(arguments["command"])) {
                        deleteCommand(arguments, receivedMessage);
                    } else if (platformsOverloads.includes(arguments["command"])) {
                        platformsCommand(receivedMessage);
                    } else if (supportOverloads.includes(arguments["command"])) {
                        supportCommand(receivedMessage);
                    } else if (creditsOverloads.includes(arguments["command"])) {
                        creditsCommand(receivedMessage);
                    } else if (setoproleOverloads.includes(arguments["command"])) {
                        setOpRoleCommand(arguments, receivedMessage);
                    } else if (newplatformOverloads.includes(arguments["command"])) {
                        newPlatformCommand(arguments, receivedMessage);
                    } else if (changeplatformtermOverloads.includes(arguments["command"])) {
                        changePlatformTermCommand(arguments, receivedMessage);
                    } else if (removeplatformOverloads.includes(arguments["command"])) {
                        removePlatformCommand(arguments, receivedMessage);
                    } else if (setplatformroleOverloads.includes(arguments["command"])) {
                        setPlatformRoleCommand(arguments, receivedMessage);
                    } else if (Object.keys(guildDictionary[receivedMessage.guild.id].platformsList).includes(arguments["command"])) {
                        lookupCommand(arguments, receivedMessage, true);
                    } else if (chrono.parse(arguments["command"]).length > 0) {
                        timeModule.convertCommand(arguments, receivedMessage, guildDictionary[receivedMessage.guild.id].userDictionary, true);
                    } else {
                        receivedMessage.author.send(`${arguments["command"]} isn't a ${client.user} command. Please check for typos or use ${client.user}\`help.\``)
                    }

                    antiSpam.push(receivedMessage.author.id);
                    setTimeout(function () {
                        antiSpam.shift();
                    }, antiSpamInterval);
                }
            } else {
                receivedMessage.author.send(`To prevent excessive messaging, users are unable to enter more than ${commandLimit} commands in ${helpers.millisecondsToHours(antiSpamInterval, true, true)}. You can use ${client.user} \`lookup (platform)\` to look up everyone's information for the given platform at once.`);
            }
        }
    }
})


client.on('guildCreate', (guild) => {
    console.log(`Added to server: ${guild.name}`);
    guildCreate(guild.id);
})


client.on('guildDelete', (guild) => {
    guildDelete(guild.id);
})


client.on('guildMemberRemove', (member) => {
    var guildID = member.guild.id;
    var cachedGuild = guildDictionary[guildID];
    var memberID = member.id;

    if (cachedGuild) {
        if (cachedGuild.userDictionary[memberID]) {
            delete cachedGuild.userDictionary[memberID];
            saveUserDictionary(guildID);
        }
    } else {
        guildCreate(guildID);
    }
})


client.on('disconnect', (error, code) => {
    console.log(`Disconnect encountered (Error code ${code}):`);
    console.log(error);
    console.log(`---Restarting`);
    login();
})


client.on('error', (error) => {
    console.log(`Error encountered:`);
    console.log(error);
    console.log(`---Restarting`);
    login();
})


function helpCommand(arguments, receivedMessage) {
    let cachedGuild = guildDictionary[receivedMessage.guild.id];

    if (convertOverloads.includes(arguments["words"][0])) {
        receivedMessage.author.send(`The *convert* command calculates a time for a given user. ${client.user} uses IANA specified timezones.\n\
Syntax: ${client.user} \`convert (time) in (starting timezone) for (user)\`\n\
\n\
The command can also be used to switch a time to a given timezone.\n\
Syntax: ${client.user} \`convert (time) in (starting timezone) to (resulting timezone)\`\n\
\n\
If you omit the starting timezone, the bot will assume you mean the timezone you've recorded for the \"timezone\" platform.`);
    } else if (countdownOverloads.includes(arguments["words"][0])) {
        receivedMessage.author.send(`The *countdown* command states the time until the given time. ${client.user} uses IANA specified timezones. If no timezone is given ${client.user} will try with the user's timezone default, then the server's local timezone failing that.\n\
Syntax: ${client.user} \`countdown (time) in (timezone)\``);
    } else if (streamshoutoutOverloads.includes(arguments["words"][0])) {
        receivedMessage.author.send(`The *shoutout* command posts the given user's stream information.\n\
Syntax: ${client.user} \`shoutout (user)\``);
    } else if (multistreamOverloads.includes(arguments["words"][0])) {
        receivedMessage.author.send(`The *multistream* command generates a link to watch multiple streams simultaneously. Optionally, you can enter the layout number last if you want to specify that.\n\
Syntax: ${client.user} \`multistream (user1) (user2)... (layout)\``);
    } else if (recordOverloads.includes(arguments["words"][0])) {
        receivedMessage.author.send(`The *record* command adds your information for given platform so people can ask the bot for it. The message containing the command will be deleted for security purposes.\n\
Syntax: ${client.user} \`record (platform) (code)\``);
    } else if (lookupOverloads.includes(arguments["words"][0])) {
        receivedMessage.author.send(`The *lookup* command tells you the information associted with the given user for the given platform.\n\
Syntax: ${client.user} \`lookup (user) (platform)\`\n\
If you leave out the user mention, ${client.user} will instead tell you everyone's information for that platform instead.\n\
Syntax: ${client.user} \`lookup (platform)`);
    } else if (sendOverloads.includes(arguments["words"][0])) {
        receivedMessage.author.send(`The *send* command sends your information on the given platform to the given user.\n\
Syntax: ${client.user} \`send (platform) (user)\``);
    } else if (whoisOverloads.includes(arguments["words"][0])) {
        receivedMessage.author.send(`The *whois* command checks if anyone uses the given username and private messages you the result.\n\
Syntax: ${client.user} \`whois (username)\``);
    } else if (deleteOverloads.includes(arguments["words"][0])) {
        receivedMessage.author.send(`The *delete* command removes your information for the given platform.\n\
Syntax: ${client.user} \`delete (platform)\``);
        if (receivedMessage.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR) || receivedMessage.member.roles.cache.has(cachedGuild.opRole)) {
            receivedMessage.author.send(`Operators can use the *delete* command to remove information for other users.\n\
Syntax: ${client.user} \`clear (user) (platform)\``);
        }
    } else if (platformsOverloads.includes(arguments["words"][0])) {
        platformsCommand(receivedMessage);
    } else if (creditsOverloads.includes(arguments["words"][0])) {
        creditsCommand(receivedMessage);
    } else if (setoproleOverloads.includes(arguments["words"][0])) {
        if (receivedMessage.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR) || receivedMessage.member.roles.cache.has(cachedGuild.opRole)) {
            receivedMessage.author.send(`The *setoprole* command updates the operator role for ${client.user}. Users with this role use operator features of this bot without serverwide administrator privileges.\n\
Syntax: ${client.user} \`setoprole (role)\``);
        } else {
            receivedMessage.author.send(`You need a role with administrator privileges${cachedGuild.opRole ? ` or the role @${receivedMessage.guild.roles.resolve(cachedGuild.opRole).name}` : ""} to view operator commands.`);
        }
    } else if (newplatformOverloads.includes(arguments["words"][0])) {
        if (receivedMessage.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR) || receivedMessage.member.roles.cache.has(cachedGuild.opRole)) {
            receivedMessage.author.send(`The *newplatform* command sets up a new game/service for users to record and retrieve information. Optionally, you can set a term to call the information that is being stored (default is "username").\n\
Syntax: ${client.user} \`newplatform (platform name) (information term)\``);
        } else {
            receivedMessage.author.send(`You need a role with administrator privileges${cachedGuild.opRole ? ` or the role @${receivedMessage.guild.roles.resolve(cachedGuild.opRole).name}` : ""} to view operator commands.`);
        }
    } else if (changeplatformtermOverloads.includes(arguments["words"][0])) {
        if (receivedMessage.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR) || receivedMessage.member.roles.cache.has(cachedGuild.opRole)) {
            receivedMessage.author.send(`The *changeplatformterm* changes what ${client.user} calls information from the given platform (default is "username").\n\
Syntax: ${client.user} \`changeplatformterm (platform name) (new term)\``);
        } else {
            receivedMessage.author.send(`You need a role with administrator privileges${cachedGuild.opRole ? ` or the role @${receivedMessage.guild.roles.resolve(cachedGuild.opRole).name}` : ""} to view operator commands.`);
        }
    } else if (removeplatformOverloads.includes(arguments["words"][0])) {
        if (receivedMessage.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR) || receivedMessage.member.roles.cache.has(cachedGuild.opRole)) {
            receivedMessage.author.send(`The *removeplatform* command specifies a platform for ${client.user} to stop recording and distributing information for. Note: this command does not remove roles associated with platforms in case someone has that role but wasn't given it by ${client.user}.\n\
Syntax: ${client.user} \`removeplatform (platform to remove)\``)
        } else {
            receivedMessage.author.send(`You need a role with administrator privileges${cachedGuild.opRole ? ` or the role @${receivedMessage.guild.roles.resolve(cachedGuild.opRole).name}` : ""} to view operator commands.`);
        }
    } else if (setplatformroleOverloads.includes(arguments["words"][0])) {
        if (receivedMessage.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR) || receivedMessage.member.roles.cache.has(cachedGuild.opRole)) {
            receivedMessage.author.send(`The *setplatformrole* command associates the given role and platform. Anyone who records information for that platform will be automatically given the associated role.\n\
Syntax: ${client.user} \`setplatformrole (platform) (role)\``)
        } else {
            receivedMessage.author.send(`You need a role with administrator privileges${cachedGuild.opRole ? ` or the role @${receivedMessage.guild.roles.resolve(cachedGuild.opRole).name}` : ""} to view operator commands.`);
        }
    } else {
        var helpSummary = `Here are all of ${client.user}'s commands:\n\
**record** - Record your information for a platform\n\
**lookup** - Look up someone else's information if they've recorded it\n\
**send** - Have ${client.user} send someone your information\n\
**whois** - Ask ${client.user} who a certain username belongs to\n\
**delete** - Remove your information for a platform\n\
**platforms** - List the games/services ${client.user} can be used to record or retrieve information for (using help on this command uses the command)\n\
**convert** - Convert a time to someone else's timezone or a given timezone\n\
**countdown** - How long until the given time\n\
**multistream** - Generate a multistream link for the given users\n\
**shoutout** - Have ${client.user} post someone's stream information\n\
**credits** - Version info and contributors (using help on this command uses the command)\n\
(and *help*)`;

        if (receivedMessage.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR) || receivedMessage.member.roles.cache.has(cachedGuild.opRole)) {
            helpSummary += `\n\nThe operator only commands are as follows:\n\
**setoprole** - Sets the operator role to the given role; not mentioning a role resets the op role to none\n\
**newplatform** - Setup a new game/service for users to record or retrieve information for\n\
**changeplatformterm** - Changes what ${client.user} calls information for the given platform\n\
**removeplatform** - Stop recording and distributing user information for a game/service\n\
**setplatformrole** - Automatically give a role to users who record information for a platform\n\
**delete** for other users`;
        }

        helpSummary += `\n\nYou can type ${client.user} \`help\` followed by one of those for specific instructions.`;
        receivedMessage.author.send(helpSummary);
    }
}


function recordCommand(arguments, receivedMessage) {
    let cachedGuild = guildDictionary[receivedMessage.guild.id];

    if (arguments["words"].length > 0) {
        if (arguments["words"].length > 1) {
            var platform = arguments["words"][0].toLowerCase();
            var codeArray = arguments["words"].slice(1);
            var friendcode = codeArray.join(" ");

            if (Object.keys(cachedGuild.platformsList).includes(platform)) { // Early out if platform is not being tracked
                if (cachedGuild.userDictionary[receivedMessage.author.id][platform]) {
                    if (cachedGuild.userDictionary[receivedMessage.author.id][platform].value != friendcode) {
                        cachedGuild.userDictionary[receivedMessage.author.id][platform].value = friendcode;
                        syncUserRolePlatform(receivedMessage.member, platform, cachedGuild);
                        saveUserDictionary(receivedMessage.guild.id);
                        receivedMessage.channel.send(`${receivedMessage.author} has recorded a ${platform} ${cachedGuild.platformsList[platform].term}. Check it with "${client.user} lookup ${receivedMessage.author} ${platform}".`);
                    } else {
                        // Error Message
                        receivedMessage.author.send(`You have already recorded ${friendcode} as your ${platform} ${cachedGuild.platformsList[platform].term} in ${receivedMessage.guild}.`)
                    }
                }
            } else {
                // Error Message
                receivedMessage.author.send(`${platform} is not currently being tracked in ${receivedMessage.guild}.`)
            }
        } else {
            // Error Message
            receivedMessage.author.send(`Please provide the information you would like to record.`);
        }
    } else {
        // Error Message
        receivedMessage.author.send(`Please provide a platform for which to record your information for.`);
    }
}


function lookupCommand(arguments, receivedMessage, shortcut = false) {
    let cachedGuild = guildDictionary[receivedMessage.guild.id];

    if (arguments["words"].length > 0) {
        if (arguments["guildMemberMentions"].length == 1) {
            if (arguments["guildMemberMentions"][0]) {
                var user = arguments["guildMemberMentions"][0].user;

                if (!user.bot) {
                    if (shortcut) {
                        var platform = arguments["command"].toLowerCase();
                    } else {
                        var platform = arguments["words"][0].toLowerCase();
                    }

                    if (Object.keys(cachedGuild.platformsList).includes(platform)) {
                        if (!cachedGuild.userDictionary[user.id] || !cachedGuild.userDictionary[user.id][platform].value) {
                            // Error Message
                            receivedMessage.channel.send(`${user} has not set a ${platform} ${cachedGuild.platformsList[platform].term} in this server's ${client.user} yet.`);
                        } else {
                            receivedMessage.author.send(`${user} has set ${cachedGuild.userDictionary[receivedMessage.author.id]["possessivepronoun"] && cachedGuild.userDictionary[receivedMessage.author.id]["possessivepronoun"].value ? cachedGuild.userDictionary[receivedMessage.author.id]["possessivepronoun"].value : 'their'} ${platform} ${cachedGuild.platformsList[platform].term} in ${receivedMessage.guild.name} as **${cachedGuild.userDictionary[user.id][platform].value}**.\n\n\
This message will expire in about ${helpers.millisecondsToHours(cachedGuild.infoLifetime)}.`).then(sentMessage => {
                                setTimeout(function () {
                                    sentMessage.edit(`Your lookup of ${user}'s ${platform} ${cachedGuild.platformsList[platform].term} from ${receivedMessage.guild.name} has expired.`);
                                }, cachedGuild.infoLifetime);
                            }).catch(console.error);
                        }
                    } else {
                        // Error Message
                        receivedMessage.author.send(`${platform} is not currently being tracked in ${receivedMessage.guild}.`)
                    }
                } else {
                    // Error Message
                    receivedMessage.author.send(`${user} is a bot. Though bots do not have friend codes, Imaginary Horizons Productions definitely welcomes our coming robot overlords.`);
                }
            } else {
                // Error Message
                receivedMessage.author.send(`That person isn't a member of ${receivedMessage.guild}.`);
            }
        } else {
            var platform = "";

            if (shortcut) {
                platform = arguments["command"].toLowerCase();
            } else {
                platform = arguments["words"][0].toLowerCase();
            }

            if (Object.keys(cachedGuild.platformsList).includes(platform)) {
                var text = `Here are all the ${platform} ${cachedGuild.platformsList[platform].term}s in ${receivedMessage.guild}'s ${client.user}:\n`;
                Object.keys(cachedGuild.userDictionary).forEach(user => {
                    if (cachedGuild.userDictionary[user][platform]) {
                        if (cachedGuild.userDictionary[user][platform].value) {
                            text += `${receivedMessage.guild.members.resolve(user).displayName}: ${cachedGuild.userDictionary[user][platform].value}\n\n\
This message will expire in about ${helpers.millisecondsToHours(cachedGuild.infoLifetime)}.`;
                        }
                    }
                })
                receivedMessage.author.send(text).then(sentMessage => {
                    setTimeout(function () {
                        sentMessage.edit(`Your lookup of ${receivedMessage.guild.name}'s ${platform} ${cachedGuild.platformsList[platform].term} has expired.`);
                    }, cachedGuild.infoLifetime);
                }).catch(console.error);
            } else {
                // Error Message
                receivedMessage.author.send(`${platform} is not currently being tracked in ${receivedMessage.guild}.`)
            }
        }
    } else {
        // Error Message
        receivedMessage.author.send(`Please provide a platform in which to look up information.`)
    }
}


function sendCommand(arguments, receivedMessage) {
    let cachedGuild = guildDictionary[receivedMessage.guild.id];

    if (arguments["guildMemberMentions"].length >= 1) {
        if (arguments["guildMemberMentions"][0]) {
            if (arguments["words"].length > 0) {
                var platform = arguments["words"][0].toLowerCase();
                if (Object.keys(cachedGuild.platformsList).includes(platform)) {
                    if (cachedGuild.userDictionary[receivedMessage.author.id] && cachedGuild.userDictionary[receivedMessage.author.id][platform].value) {
                        var senderInfo = `${receivedMessage.author.username} from ${receivedMessage.guild} has sent you ${cachedGuild.userDictionary[receivedMessage.author.id]["possessivepronoun"] && cachedGuild.userDictionary[receivedMessage.author.id]["possessivepronoun"].value ? cachedGuild.userDictionary[receivedMessage.author.id]["possessivepronoun"].value : 'their'} ${platform} ${cachedGuild.platformsList[platform].term}`;

                        arguments["guildMemberMentions"].forEach(recipient => {
                            recipient.send(senderInfo + `. It is: ${cachedGuild.userDictionary[receivedMessage.author.id][platform].value}\n\n\
This message will expire in about ${helpers.millisecondsToHours(cachedGuild.infoLifetime)}.`).then(sentMessage => {
                                setTimeout(function () {
                                    sentMessage.edit(senderInfo + `, but it has expired. You can look it up again with ${client.user} \`lookup @${receivedMessage.author.username} ${platform}\`.`);
                                }, cachedGuild.infoLifetime);
                            }).catch(console.error);
                        })
                        receivedMessage.author.send(`Your ${platform} ${cachedGuild.platformsList[platform].term} has been sent to ${arguments["guildMemberMentions"].toString()}.`).catch(console.error);
                    } else {
                        // Error Message
                        receivedMessage.author.send(`You have not recorded a ${platform} ${cachedGuild.platformsList[platform].term} in ${receivedMessage.guild}.`);
                    }
                } else {
                    // Error Message
                    receivedMessage.author.send(`${platform} is not currently being tracked in ${receivedMessage.guild}.`)
                }
            } else {
                // Error Message
                receivedMessage.author.send(`Please provide the platform of the information to send.`)
            }
        } else {
            // Error Message
            receivedMessage.author.send(`That person isn't a member of ${receivedMessage.guild}.`);
        }
    } else {
        // Error Message
        receivedMessage.author.send(`Please mention someone to send your information to.\n\
\n\
You sent: ${receivedMessage}`);
    }
}


function whoisCommand(arguments, receivedMessage) {
    let cachedGuild = guildDictionary[receivedMessage.guild.id];

    if (arguments["words"].length > 0) {
        var searchTerm = arguments["words"][0];
        var reply = `The following people have recorded ${searchTerm} in ${receivedMessage.guild.name}:`;
        Object.keys(cachedGuild.userDictionary).forEach(user => {
            for (var platform in cachedGuild.userDictionary[user]) {
                if (cachedGuild.userDictionary[user][platform].value == searchTerm) {
                    reply += `\n${receivedMessage.guild.members.resolve(user).displayName} for ${platform}`;
                }
            }
        })

        receivedMessage.author.send(reply);
    } else {
        // Error Message
        receivedMessage.author.send(`Please specify a username to check for.\n\
\n\
You sent: ${receivedMessage}`);
    }
}


function deleteCommand(arguments, receivedMessage) {
    let cachedGuild = guildDictionary[receivedMessage.guild.id];

    if (arguments["words"].length > 0) {
        var platform = arguments["words"][0].toLowerCase();
        var msgList = arguments["words"].slice(1);
        var reason = msgList.join(" ");

        if (arguments["guildMemberMentions"].length == 1) {
            if (arguments["guildMemberMentions"][0]) {
                if (receivedMessage.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR) || receivedMessage.member.roles.cache.has(cachedGuild.opRole)) {
                    if (Object.keys(cachedGuild.platformsList).includes(platform)) {
                        var target = arguments["guildMemberMentions"][0];

                        if (cachedGuild.userDictionary[target.id] && cachedGuild.userDictionary[target.id][platform].value) {
                            cachedGuild.userDictionary[target.id][platform] = new FriendCode();
                            target.send(`Your ${platform} ${cachedGuild.platformsList[platform].term} has been removed${reason ? ` from ${receivedMessage.guild} because ${reason}` : ""}.`);
                            syncUserRolePlatform(target, platform, cachedGuild);
                            saveUserDictionary(receivedMessage.guild.id);
                            receivedMessage.author.send(`You have removed ${target}'s ${platform} ${cachedGuild.platformsList[platform].term} from ${receivedMessage.guild}.`);
                        } else {
                            // Error Message
                            receivedMessage.author.send(`${target} does not have a ${platform} ${cachedGuild.platformsList[platform].term} recorded in ${receivedMessage.guild}.`);
                        }
                    } else {
                        // Error Message
                        receivedMessage.author.send(`You need a role with administrator privileges${cachedGuild.opRole ? ` or the role @${receivedMessage.guild.roles.resolve(cachedGuild.opRole).name}` : ""} to remove ${cachedGuild.platformsList[platform].term}s for others.`).catch(console.error);
                    }
                } else {
                    // Error Message
                    receivedMessage.author.send(`${platform} is not currently being tracked in ${receivedMessage.guild}.`).catch(console.error);
                }
            } else {
                // Error Message
                receivedMessage.author.send(`That person isn't a member of ${receivedMessage.guild}.`).catch(console.error);
            }
        } else {
            if (Object.keys(cachedGuild.platformsList).includes(platform)) {
                if (cachedGuild.userDictionary[receivedMessage.author.id] && cachedGuild.userDictionary[receivedMessage.author.id][platform].value) {
                    cachedGuild.userDictionary[receivedMessage.author.id][platform] = new FriendCode();
                    receivedMessage.author.send(`You have removed your ${platform} ${cachedGuild.platformsList[platform].term} from ${receivedMessage.guild}.`).catch(console.error);
                    syncUserRolePlatform(receivedMessage.member, platform, cachedGuild);
                    saveUserDictionary(receivedMessage.guild.id);
                } else {
                    // Error Message
                    receivedMessage.author.send(`You do not currently have a ${platform} ${cachedGuild.platformsList[platform].term} recorded in ${receivedMessage.guild}.`).catch(console.error);
                }
            } else {
                // Error Message
                receivedMessage.author.send(`${platform} is not currently being tracked in ${receivedMessage.guild}.`).catch(console.error);
            }
        }
    } else {
        // Error Message
        receivedMessage.author.send(`Please provide the platform of the information to delete.`)
    }
}


function platformsCommand(receivedMessage) {
    let processedText = Object.keys(guildDictionary[receivedMessage.guild.id].platformsList).toString().replace(/,/g, ', ');

    receivedMessage.channel.send(`This server's tracked platforms are: ${processedText}`).catch(console.error);
}


function supportCommand(receivedMessage) {
    receivedMessage.author.send(`Thank you for using DirectoryBot (${client.user})! Here are some ways to support its development:\n\
__Vote for us on top.gg__\n\
top.gg is a Discord bot listing and distrabution service. Voting for DirectoryBot causes it to appear earlier in searches. (Link coming soon)\n\n\
__Contribute code__\n\
Check out our github and tackle some issues! <https://github.com/ntseng/DirectoryBot>\n\n\
__Create some social media buzz__\n\
Use the hashtags #DirectoryBotDiscord or #ImaginaryHorizonsProductions\n\n\
__Chip in for server costs__\n\
Imaginary Horizons Productions has a Patreon for all of our products and games. Check it out here: https://www.patreon.com/imaginaryhorizonsproductions `).catch(console.error);
}


function creditsCommand(receivedMessage) {
    var embed = new Discord.MessageEmbed()
        .setAuthor(`Imaginary Horizons Productions`, `https://cdn.discordapp.com/icons/353575133157392385/c78041f52e8d6af98fb16b8eb55b849a.png `, `https://discord.gg/bcE3Syu `)
        .setTitle(`DirectoryBot Credits (Version B1.3)`)
        .setURL(`https://github.com/ntseng/DirectoryBot `)
        .addField(`Design & Engineering`, `Nathaniel Tseng ( <@106122478715150336> | https://twitter.com/Archainis )`)
        .addField(`Engineering`, `Lucas Ensign ( <@112785244733628416> | https://twitter.com/SillySalamndr )`)
        .addField(`Art`, `Angela Lee ( https://www.angelasylee.com/ )`)
        .addBlankField()
        .addField(`Patreon Archivists - https://www.patreon.com/imaginaryhorizonsproductions `, `Stacy Lane`)
        .addField(`Patreon Explorers - https://www.patreon.com/imaginaryhorizonsproductions `, `Eric Hu`)
        .setFooter(`Support development with "@DirectoryBot support"`, client.user.avatarURL())
        .setTimestamp();
    receivedMessage.author.send(embed).catch(console.error);
}


function setOpRoleCommand(arguments, receivedMessage) {
    let cachedGuild = guildDictionary[receivedMessage.guild.id];

    if (receivedMessage.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR) || receivedMessage.member.roles.cache.has(cachedGuild.opRole)) {
        if (arguments["roleMentions"].length > 0) {
            cachedGuild.opRole = arguments["roleMentions"][0].id;
            receivedMessage.channel.send(`The ${client.user} operator role has been set to @${arguments["roleMentions"][0].name}.`).catch(console.error);
            saveOpRole(receivedMessage.guild.id);
        } else {
            if (cachedGuild.opRole) {
                cachedGuild.opRole = null;
                receivedMessage.channel.send(`The ${client.user} operator role has been cleared.`).catch(console.error);
                saveOpRole(receivedMessage.guild.id);
            } else {
                // Error Message
                receivedMessage.author.send(`${receivedMessage.guild.name} is already lacking an operator role.`).catch(console.error);
            }
        }
    } else {
        // Error Message
        receivedMessage.author.send(`You need a role with administrator privileges${cachedGuild.opRole ? ` or the role @${receivedMessage.guild.roles.resolve(cachedGuild.opRole).name}` : ""} to change the operator role.`).catch(console.error);
    }
}


function newPlatformCommand(arguments, receivedMessage) {
    let cachedGuild = guildDictionary[receivedMessage.guild.id];

    if (receivedMessage.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR) || receivedMessage.member.roles.cache.has(cachedGuild.opRole)) {
        if (arguments["words"].length > 0) {
            let platform = arguments["words"][0].toLowerCase();
            let term = arguments["words"][1];

            if (!cachedGuild.platformsList[platform]) {
                cachedGuild.platformsList[platform] = new PlatformData();
                if (term) {
                    cachedGuild.platformsList[platform].term = term;
                }
                Object.keys(cachedGuild.userDictionary).forEach((user) => {
                    cachedGuild.userDictionary[user][platform] = new FriendCode();
                })
                receivedMessage.channel.send(`${arguments["words"][0]} ${cachedGuild.platformsList[platform].term}s can now be recorded and retrieved.`);
                savePlatformsList(receivedMessage.guild.id);
            } else {
                // Error Message
                receivedMessage.author.send(`${arguments["words"][0]} ${cachedGuild.platformsList[platform].term}s can already be recorded and retrieved.`);
            }
        } else {
            // Error Message
            receivedMessage.author.send(`Please provide a name for the new platform.\n\
\n\
You sent: ${receivedMessage}`);
        }
    } else {
        // Error Message
        receivedMessage.author.send(`You need a role with administrator privileges${cachedGuild.opRole ? ` or the role @${receivedMessage.guild.roles.resolve(cachedGuild.opRole).name}` : ""} to add new platforms.`);
    }
}


function changePlatformTermCommand(arguments, receivedMessage) {
    let cachedGuild = guildDictionary[receivedMessage.guild.id];

    if (receivedMessage.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR) || receivedMessage.member.roles.cache.has(cachedGuild.opRole)) {
        if (arguments["words"].length > 0) {
            if (arguments["words"].length > 1) {
                let platform = arguments["words"][0];
                let term = arguments["words"][1];

                if (cachedGuild.platformsList[platform.toLowerCase()]) {
                    cachedGuild.platformsList[platform.toLowerCase()].term = term;
                    receivedMessage.author.send(`Information for *${platform}* will now be referred to as **${term}** in ${receivedMessage.guild}.`);
                    savePlatformsList(receivedMessage.guild.id);
                } else {
                    // Error Message
                    receivedMessage.author.send(`${platform} is not currently being recorded in ${receivedMessage.guild}.`);
                }
            } else {
                // Error Message
                receivedMessage.author.send(`Please provide a term to change to for the platform.`);
            }
        } else {
            // Error Message
            receivedMessage.author.send(`Please provide a platform for which to change the term.`);
        }
    } else {
        // Error Message
        receivedMessage.author.send(`You need a role with administrator privileges${cachedGuild.opRole ? ` or the role @${receivedMessage.guild.roles.resolve(cachedGuild.opRole).name}` : ""} to change platform terms.`);
    }
}


function removePlatformCommand(arguments, receivedMessage) {
    let cachedGuild = guildDictionary[receivedMessage.guild.id];

    if (receivedMessage.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR) || receivedMessage.member.roles.cache.has(cachedGuild.opRole)) {
        if (arguments["words"].length > 0) {
            let platform = arguments["words"][0];

            if (cachedGuild.platformsList[platform.toLowerCase()]) {
                delete cachedGuild.platformsList[platform.toLowerCase()];
                Object.keys(cachedGuild.userDictionary).forEach(user => {
                    delete cachedGuild.userDictionary[user][platform.toLowerCase()];
                })
                receivedMessage.channel.send(`${platform} information will no longer be recorded.`);
                savePlatformsList(receivedMessage.guild.id);
            } else {
                // Error Message
                receivedMessage.author.send(`${platform} is not currently being recorded in ${receivedMessage.guild}.`);
            }
        } else {
            // Error Message
            receivedMessage.author.send(`Please provide a platform to remove.`).cath(console.error);
        }
    } else {
        // Error Message
        receivedMessage.author.send(`You need a role with administrator privileges${cachedGuild.opRole ? ` or the role @${receivedMessage.guild.roles.resolve(cachedGuild.opRole).name}` : ""} to remove platforms.`);
    }
}


function setPlatformRoleCommand(arguments, receivedMessage) {
    let cachedGuild = guildDictionary[receivedMessage.guild.id];

    if (receivedMessage.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR) || receivedMessage.member.roles.cache.has(cachedGuild.opRole)) {
        if (arguments["words"].length > 0) {
            if (arguments["roleMentions"].length > 0) {
                var platform = arguments['words'][0];
                var role = arguments['roleMentions'][0];

                if (cachedGuild.platformsList[platform]) {
                    if (cachedGuild.platformsList[platform].role != role) {
                        cachedGuild.platformsList[platform].role = role;
                        savePlatformsList(receivedMessage.guild.id);
                        Object.keys(cachedGuild.userDictionary).forEach(user => {
                            syncUserRolePlatform(receivedMessage.guild.members.resolve(user), platform, cachedGuild);
                        })
                        saveUserDictionary(receivedMessage.guild.id);
                        receivedMessage.channel.send(`Server members who set a ${platform} ${cachedGuild.platformsList[platform].term} will now automatically be given the role @${role.name}.`);
                    } else {
                        // Error Message
                        receivedMessage.author.send(`The role @${role.name} is already associated with ${platform} in ${receivedMessage.guild}.`);
                    }
                } else {
                    // Error Message
                    receivedMessage.author.send(`${receivedMessage.guild} doesn't have a platform named ${platform}.`);
                }
            } else {
                // Error Message
                receivedMessage.author.send(`Please provide a role to set for the platform.`).catch(console.error);
            }
        } else {
            // Error Message
            receivedMessage.author.send(`Please provide a platform to set a role for.`).catch(console.error);
        }
    } else {
        // Error Message
        receivedMessage.author.send(`You need a role with administrator privileges${cachedGuild.opRole ? ` or the role @${receivedMessage.guild.roles.resolve(cachedGuild.opRole).name}` : ""} to remove platforms.`);
    }
}


function login() {
    fs.readFile(`encryptionKey.txt`, `utf8`, (error, keyInput) => {
        if (error) {
            console.log(error);
        } else {
            fs.readFile("guildsList.txt", 'utf8', (error, guildsListInput) => {
                if (error) {
                    console.log(error);
                } else {
                    if (guildsListInput == "") {
                        participatingGuildsIDs = [];
                        saveParticipatingGuildsIDs();
                    } else {
                        participatingGuildsIDs = JSON.parse(encrypter.AES.decrypt(guildsListInput, keyInput).toString(encrypter.enc.Utf8))["list"];
                    }
                }

                fs.readFile("authentication.json", 'utf8', (error, authenticationInput) => {
                    if (error) {
                        console.log(error);
                    } else {
                        var authentication = {};
                        Object.assign(authentication, JSON.parse(authenticationInput));
                        client.login(authentication["token"]);
                    }
                });
            });
        }
    })
}


function guildCreate(guildID) {
    participatingGuildsIDs.push(guildID);
    guildDictionary[guildID] = new GuildSpecifics();

    saveOpRole(guildID);
    savePlatformsList(guildID);
    saveUserDictionary(guildID);
    saveParticipatingGuildsIDs();
}

function guildDelete(guildID) {
    if (fs.existsSync(`./data/${guildID}`)) {
        if (fs.existsSync(`./data/${guildID}/opRole.txt`)) {
            fs.unlinkSync(`./data/${guildID}/opRole.txt`, (error) => {
                if (error) {
                    console.log(error);
                }
            })
        }
        if (fs.existsSync(`./data/${guildID}/userDictionary.txt`)) {
            fs.unlinkSync(`./data/${guildID}/userDictionary.txt`, (error) => {
                if (error) {
                    console.log(error);
                }
            })
        }
        if (fs.existsSync(`./data/${guildID}/platformsList.txt`)) {
            fs.unlinkSync(`./data/${guildID}/platformsList.txt`, (error) => {
                if (error) {
                    console.log(error);
                }
            })
        }
        fs.rmdirSync(`./data/${guildID}`);
    }
    if (fs.existsSync(`./backups/${guildID}`)) {
        if (fs.existsSync(`./backups/${guildID}/opRole.txt`)) {
            fs.unlinkSync(`./backups/${guildID}/opRole.txt`, (error) => {
                if (error) {
                    console.log(error);
                }
            })
        }
        if (fs.existsSync(`./backups/${guildID}/userDictionary.txt`)) {
            fs.unlinkSync(`./backups/${guildID}/userDictionary.txt`, (error) => {
                if (error) {
                    console.log(error);
                }
            })
        }
        if (fs.existsSync(`./backups/${guildID}/platformsList.txt`)) {
            fs.unlinkSync(`./backups/${guildID}/platformsList.txt`, (error) => {
                if (error) {
                    console.log(error);
                }
            })
        }
        fs.rmdirSync(`./backups/${guildID}`, (error) => {
            if (error) {
                console.log(error);
            }
        })
    }

    participatingGuildsIDs.splice(participatingGuildsIDs.indexOf(guildID), 1);
    saveParticipatingGuildsIDs();
}

function saveOpRole(guildID, backup = false) {
    fs.readFile(`encryptionKey.txt`, 'utf8', (error, keyInput) => {
        if (error) {
            console.log(error);
        } else {
            var filePath = `./`;
            if (backup) {
                filePath += 'backups/' + guildID + '/opRole.txt';
                if (!fs.existsSync('./backups')) {
                    fs.mkdirSync('./backups');
                }
                if (!fs.existsSync('./backups/' + guildID)) {
                    fs.mkdirSync('./backups/' + guildID);
                }
            } else {
                filePath += 'data/' + guildID + '/opRole.txt';
                if (!fs.existsSync('./data')) {
                    fs.mkdirSync('./data');
                }
                if (!fs.existsSync('./data/' + guildID)) {
                    fs.mkdirSync('./data/' + guildID);
                }
            }
            fs.writeFile(filePath, encrypter.AES.encrypt(guildDictionary[guildID].opRole, keyInput).toString(), 'utf8', (error) => {
                if (error) {
                    console.log(error);
                }
            })
        }
    })
}

function saveUserDictionary(guildID, backup = false) {
    fs.readFile("encryptionKey.txt", 'utf8', (error, keyInput) => {
        if (error) {
            console.log(error);
        } else {
            var filePath = `./`;
            if (backup) {
                filePath += 'backups/' + guildID + '/userDictionary.txt';
                if (!fs.existsSync('./backups')) {
                    fs.mkdirSync('./backups');
                }
                if (!fs.existsSync('./backups/' + guildID)) {
                    fs.mkdirSync('./backups/' + guildID);
                }
            } else {
                filePath += 'data/' + guildID + '/userDictionary.txt';
                if (!fs.existsSync('./data')) {
                    fs.mkdirSync('./data');
                }
                if (!fs.existsSync('./data/' + guildID)) {
                    fs.mkdirSync('./data/' + guildID);
                }
            }
            fs.writeFile(filePath, encrypter.AES.encrypt(JSON.stringify(guildDictionary[guildID].userDictionary), keyInput).toString(), 'utf8', (error) => {
                if (error) {
                    console.log(error);
                }
            })
        }
    })
}

function savePlatformsList(guildID, backup = false) {
    fs.readFile("encryptionKey.txt", 'utf8', (error, keyInput) => {
        if (error) {
            console.log(error);
        } else {
            var filePath = `./`;
            if (backup) {
                filePath += 'backups/' + guildID + '/platformsList.txt';
                if (!fs.existsSync('./backups')) {
                    fs.mkdirSync('./backups');
                }
                if (!fs.existsSync('./backups/' + guildID)) {
                    fs.mkdirSync('./backups/' + guildID);
                }
            } else {
                filePath += 'data/' + guildID + '/platformsList.txt';
                if (!fs.existsSync('./data')) {
                    fs.mkdirSync('./data');
                }
                if (!fs.existsSync('./data/' + guildID)) {
                    fs.mkdirSync('./data/' + guildID);
                }
            }
            fs.writeFile(filePath, encrypter.AES.encrypt(JSON.stringify(guildDictionary[guildID].platformsList), keyInput).toString(), 'utf8', (error) => {
                if (error) {
                    console.log(error);
                }
            })
        }
    })
}

function saveParticipatingGuildsIDs(backup = false) {
    var guildsListOutput = { "list": participatingGuildsIDs };

    fs.readFile(`encryptionKey.txt`, `utf8`, (error, keyInput) => {
        if (error) {
            console.log(error);
        } else {
            var filePath = `./`;
            if (backup) {
                filePath += 'backups/guildsList.txt';
                if (!fs.existsSync('./backups')) {
                    fs.mkdirSync('./backups');
                }
            } else {
                filePath += 'guildsList.txt';
            }
            fs.writeFile(filePath, encrypter.AES.encrypt(JSON.stringify(guildsListOutput), keyInput), 'utf8', (error) => {
                if (error) {
                    console.log(error);
                }
            })
        }
    })
}

function syncUserRolePlatform(member, platformName, guildSpecifics) {
    if (guildSpecifics.userDictionary[member.id]) {
        if (guildSpecifics.platformsList[platformName].role) {
            if (guildSpecifics.userDictionary[member.id][platformName].value) {
                member.roles.add(guildSpecifics.platformsList[platformName].role);
            }
        }
    }
}
