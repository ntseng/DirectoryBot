const Discord = require('discord.js');
const fs = require('fs');
var encrypter = require('crypto-js');
var timeModule = require('./DirectoryBot_TimeModule.js');
var twitchModule = require('./DirectoryBot_TwitchModule.js');

const client = new Discord.Client();

class GuildSpecifics {
    constructor(userDictionaryInput = {}, platformsListInput = { "possessivepronoun": new PlatformData("preference"), "timezone": new PlatformData("default"), "twitch": new PlatformData() }, opRoleInput = "") {
        this.userDictionary = userDictionaryInput;
        this.platformsList = platformsListInput;
        this.opRole = opRoleInput;
    }
}

class FriendCode {
    constructor(input = null) {
        this.value = input;
    }
}

class PlatformData {
    //TODO have multiple entries per platform
    constructor(input = "username") {
        this.term = input;
        this.description;
        this.role;
    }
}


var helpOverloads = ["help"];
var convertOverloads = ["convert"];
var countdownOverloads = ["countdown"];
var multistreamOverloads = ["multistream", "multitwitch"];
var recordOverloads = ["record", "log"];
var sendOverloads = ["send", "tell"];
var lookupOverloads = ["lookup"];
var whoisOverloads = ["whois"];
var deleteOverloads = ["delete", "remove", "clear"];
var platformsOverloads = ["platforms"];
var creditsOverloads = ["credits", "creditz", "about"];
var setoproleOverloads = ["setoprole"];
var newplatformOverloads = ["newplatform", "addplatform"];
var removeplatformOverloads = ["removeplatform"];
var setplatformroleOverloads = ["setplatformrole"];

var participatingGuildsIDs = [];
var guildDictionary = {};

var antiSpam = [];
var commandLimit = 3;

fs.readFile(`encryptionKey.txt`, `utf8`, (error, keyInput) => {
    if (error) {
        console.log(error);
    } else {
        fs.readFile("guildsList.txt", 'utf8', (error, guildsListInput) => {
            if (error) {
                console.log(error);
            } else {
                participatingGuildsIDs = JSON.parse(encrypter.AES.decrypt(guildsListInput, keyInput).toString(encrypter.enc.Utf8))["list"];
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

client.on('ready', () => {
    fs.readFile("encryptionKey.txt", 'utf8', (error, keyInput) => {
        if (error) {
            console.log(error);
        } else {
            participatingGuildsIDs.forEach(guildID => {
                var newGuild = true;
                var opRoleLoaded = "";
                var userDictionaryLoaded = {};
                var platformsListLoaded = {};

                fs.readFile(`./data/${guildID}/opRole.txt`, 'utf8', (error, opRoleInput) => {
                    if (error) {
                        console.log(error);
                    } else {
                        opRoleLoaded = encrypter.AES.decrypt(opRoleInput, keyInput).toString(encrypter.enc.Utf8);
                        newGuild = false;
                    }

                    fs.readFile(`./data/${guildID}/userDictionary.txt`, 'utf8', (error, userDictionaryInput) => {
                        if (error) {
                            console.log(error);
                        } else {
                            Object.assign(userDictionaryLoaded, JSON.parse(encrypter.AES.decrypt(userDictionaryInput, keyInput).toString(encrypter.enc.Utf8)));
                            newGuild = false;
                        }

                        fs.readFile(`./data/${guildID}/platformsList.txt`, 'utf8', (error, platformsListInput) => {
                            if (error) {
                                console.log(error);
                            } else {
                                Object.assign(platformsListLoaded, JSON.parse(encrypter.AES.decrypt(platformsListInput, keyInput).toString(encrypter.enc.Utf8)));
                                newGuild = false;
                            }

                            if (newGuild) {
                                newGuildEntry(guildID);
                            } else {
                                guildDictionary[guildID] = new GuildSpecifics(userDictionaryLoaded, platformsListLoaded, opRoleLoaded);
                            }
                        });
                    });
                });
            })
        }
    })

    client.user.setActivity("\"@DirectoryBot help\"", { type: "LISTENING" });
    console.log("Connected as " + client.user.tag);
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
                messageArray = messageArray.slice(1);
                var arguments = {
                    "userMentions": filterMentions(messageArray, receivedMessage.guild),
                    "roleMentions": filterRoleMentions(messageArray),
                    "words": filterWords(messageArray) // First element is usually primary command
                };

                if (arguments["words"].length > 0) {
                    if (!guildDictionary[receivedMessage.guild.id].userDictionary[receivedMessage.author.id]) {
                        guildDictionary[receivedMessage.guild.id].userDictionary[receivedMessage.author.id] = {};
                        Object.keys(guildDictionary[receivedMessage.guild.id].platformsList).forEach((platformInList) => {
                            guildDictionary[receivedMessage.guild.id].userDictionary[receivedMessage.author.id][platformInList] = new FriendCode();
                        });
                    }

                    if (helpOverloads.includes(arguments["words"][0])) {
                        helpCommand(arguments, receivedMessage);
                    } else if (convertOverloads.includes(arguments["words"][0])) {
                        timeModule.convertCommand(arguments, receivedMessage, guildDictionary[receivedMessage.guild.id].userDictionary);
                    } else if (countdownOverloads.includes(arguments["words"][0])) {
                        timeModule.countdownCommand(arguments, receivedMessage);
                    } else if (multistreamOverloads.includes(arguments["words"][0])) {
                        twitchModule.multistreamCommand(arguments, receivedMessage, guildDictionary[receivedMessage.guild.id].userDictionary);
                    } else if (recordOverloads.includes(arguments["words"][0])) {
                        recordCommand(arguments, receivedMessage);
                    } else if (lookupOverloads.includes(arguments["words"][0])) {
                        lookupCommand(arguments, receivedMessage);
                    } else if (sendOverloads.includes(arguments["words"][0])) {
                        sendCommand(arguments, receivedMessage);
                    } else if (whoisOverloads.includes(arguments["words"][0])) {
                        whoisCommand(arguments, receivedMessage);
                    } else if (deleteOverloads.includes(arguments["words"][0])) {
                        deleteCommand(arguments, receivedMessage);
                    } else if (platformsOverloads.includes(arguments["words"][0])) {
                        platformsCommand(receivedMessage);
                    } else if (creditsOverloads.includes(arguments["words"][0])) {
                        creditsCommand(receivedMessage);
                    } else if (setoproleOverloads.includes(arguments["words"][0])) {
                        setOpRoleCommand(arguments, receivedMessage);
                    } else if (newplatformOverloads.includes(arguments["words"][0])) {
                        newPlatformCommand(arguments, receivedMessage);
                    } else if (removeplatformOverloads.includes(arguments["words"][0])) {
                        removePlatformCommand(arguments, receivedMessage);
                    } else if (setplatformroleOverloads.includes(arguments["words"][0])) {
                        setPlatformRoleCommand(arguments, receivedMessage);
                    } else if (Object.keys(platformsList).includes(arguments["words"][0])) {
                        lookupCommand(arguments, receivedMessage);
                    } else {//TODO convert command shortcut if input starts with a time
                        receivedMessage.channel.send(`${arguments["words"][0]} isn't a **DirectoryBot** command. Please check for typos or use \`@DirectoryBot help.\``)
                    }

                    antiSpam.push(receivedMessage.author.id);
                    setTimeout(function () { antiSpam.shift(); }, 5000);
                }
            } else {
                receivedMessage.author.send(`To prevent excessive messaging, users are unable to enter more than ${commandLimit} commands in 5 seconds. You can use \`@DirectoryBot lookup (platform)\` to look up everyone's information for the given platform at once.`);
            }
        }
    }
})


client.on('guildCreate', (guild) => {
    guildCreate(guild.id);
})


client.on('guildDelete', (guild) => {
    participatingGuildsIDs.splice(participatingGuildsIDs.indexOf(guild.id), 1);
    saveParticipatingGuildsIDs();
})


function helpCommand(arguments, receivedMessage) {
    var opRole = guildDictionary[receivedMessage.guild.id].opRole;

    if (arguments["words"].length - 1 == 0 || arguments['words'][1] == "help") {
        receivedMessage.channel.send(`Here are all of **DirectoryBot**'s commands:\n\
*convert* - Convert a time to someone else's timezone or a given timezone\n\
*countdown* - How long until the given time\n\
*multistream* - Generate a multistream link for the given users\n\
*platforms* - List the games/services **DirectoryBot** can be used to record or retrieve information for\n\
*record* - Record your information for a platform\n\
*lookup* - Look up someone else's information if they've recorded it\n\
*send* - Have DirectoryBot send someone your information\n\
*whois* - Ask DirectoryBot who a certain username belongs to\n\
*delete* - Remove your information for a platform\n\
*credits* - Version info and contributors\n\
(and *help*).\n\
You can type \`@directorybot help\` followed by one of those for specific instructions. If you are looking for operator commands, type \`@DirectoryBot help op\`.`);
    } else if (arguments["words"][1] == "admin" || arguments["words"][1] == "op" || arguments["words"][1] == "operator") {
        if (receivedMessage.member.hasPermission('ADMINISTRATOR') || receivedMessage.member.roles.has(opRole)) {
            receivedMessage.author.send(`The operator commands are as follows:\n\
*newplatform* - Setup a new game/service for users to record or retrieve information for\n\
*removeplatform* - Stop recording and distributing user information for a game/service\n\
*setplatformrole* - Automatically give a role to users who record information for a platform\n\
*delete* for other users`);
        } else {
            receivedMessage.author.send(`You need a role with administrator privileges or the role ${receivedMessage.guild.roles.get(opRole).name} to view the operator commands.`);
        }
    } else if (convertOverloads.includes(arguments["words"][1])) {
        receivedMessage.channel.send(`The *convert* command calculates a time for a given user. For best results, place timezones between parentheses.\n\
Syntax: \`@DirectoryBot convert (time) in (starting timezone) for (user)\`\n\
\n\
The command can also be used to switch a time to a given timezone.\n\
Syntax: \`@DirectoryBot convert (time) in (starting timezone) to (resulting timezone)\`\n\
\n\
If you omit the starting timezone, the bot will assume you mean the timezone you've recorded for the \"timezone\" platform.`);
    } else if (countdownOverloads.includes(arguments["words"][1])) {
        receivedMessage.channel.send(`The *countdown* command states the time until the given time.\n\
Syntax: \`@DirectoryBot countdown (time) (timezone)\``);
    } else if (multistreamOverloads.includes(arguments["words"][1])) {
        receivedMessage.channel.send(`The *multistream* command generates a link to watch multiple streams simultaneously. Optionally, you can enter the layout number last if you want to specify that.\n\
Syntax: \`@DirectoryBot multistream (user1) (user2)... (layout)\``);
    } else if (recordOverloads.includes(arguments["words"][1])) {
        receivedMessage.channel.send(`The *record* command adds the code information you gave for the given platform so that the bot can use that information and people can ask the bot for it.\n\
Syntax: \`@DirectoryBot record (platform) (code)\``);
    } else if (lookupOverloads.includes(arguments["words"][1])) {
        receivedMessage.channel.send(`The *lookup* command tells you the information associted with the given user for the given platform.\n\
Syntax: \`@DirectoryBot lookup (user) (platform)\`\n\
If you leave out the user mention, **DirectoryBot** will instead tell you everyone's information for that platform instead.\n\
Syntax: \`@DirectoryBot lookup (platform)`);
    } else if (sendOverloads.includes(arguments["words"][1])) {
        receivedMessage.channel.send(`The *send* command sends your information on the given platform to the given user.\n\
Syntax: \`@DirectoryBot send (platform) (user)\``);
    } else if (whoisOverloads.includes(arguments["words"][1])) {
        receivedMessage.channel.send(`The *whois* command checks if anyone uses the given username and private messages you the result.\n\
Syntax: \`@DirectoryBot whois (username)\``);
    } else if (deleteOverloads.includes(arguments["words"][1])) {
        receivedMessage.channel.send(`The *delete* command removes your information for the given platform.\n\
Syntax: \`@DirectoryBot delete (platform)\``);
        if (receivedMessage.member.hasPermission('ADMINISTRATOR') || receivedMessage.member.roles.has(opRole)) {
            receivedMessage.author.send(`Operators can use the *delete* command to remove information for other users.\n\
Syntax: \`@DirectoryBot clear (user) (platform)\``);
        }
    } else if (platformsOverloads.includes(arguments["words"][1])) {
        platformsCommand(receivedMessage);
    } else if (creditsOverloads.includes(arguments["words"][1])) {
        creditsCommand(receivedMessage);
    } else if (setoproleOverloads.includes(arguments["words"][1])) {
        if (receivedMessage.member.hasPermission('ADMINISTRATOR') || receivedMessage.member.roles.has(opRole)) {
            receivedMessage.author.send(`The *setoprole* command updates the operator role for **DirectoryBot**. Users with this role use operator features of this bot without serverwide administrator privileges.\n\
Syntax: \`@DirectoryBot setoprole (role)\``);
        } else {
            receivedMessage.author.send(`You need a role with administrator privileges or the role ${receivedMessage.guild.roles.get(opRole).name} to view operator commands.`);
        }
    } else if (newplatformOverloads.includes(arguments["words"][1])) {
        if (receivedMessage.member.hasPermission('ADMINISTRATOR') || receivedMessage.member.roles.has(opRole.opRole)) {
            receivedMessage.author.send(`The *newplatform* command sets up a new game/service for users to record and retrieve information.\n\
Syntax: \`@DirectoryBot newplatform (new game/service)\``);
        } else {
            receivedMessage.author.send(`You need a role with administrator privileges or the role ${receivedMessage.guild.roles.get(opRole).name} to view operator commands.`);
        }
    } else if (removeplatformOverloads.includes(arguments["words"][1])) {
        if (receivedMessage.member.hasPermission('ADMINISTRATOR') || receivedMessage.member.roles.has(opRole)) {
            receivedMessage.author.send(`The *removeplatform* command specifies a platform for **DirectoryBot** to stop recording and distributing information for.\n\
Syntax: \`@DirectoryBot removeplatform (platform to remove)\``)
        } else {
            receivedMessage.author.send(`You need a role with administrator privileges or the role ${receivedMessage.guild.roles.get(opRole).name} to view operator commands.`);
        }
    } else if (setplatformroleOverloads.includes(arguments["words"][1])) {
        if (receivedMessage.member.hasPermission('ADMINISTRATOR') || receivedMessage.member.roles.has(opRole)) {
            receivedMessage.author.send(`The *setplatformrole* command associates the given role and platform. Anyone who records information for that platform will be automatically given the associated role.\n\
Syntax: \`@DirectoryBot setplatformrole (platform) (role)\``)
        } else {
            receivedMessage.author.send(`You need a role with administrator privileges or the role ${receivedMessage.guild.roles.get(opRole).name} to view operator commands.`);
        }
    }
}


function recordCommand(arguments, receivedMessage) {
    var userDictionary = guildDictionary[receivedMessage.guild.id].userDictionary;
    var platformsList = guildDictionary[receivedMessage.guild.id].platformsList;

    var platform = arguments["words"][1].toLowerCase();
    var friendcode = arguments["words"][2];

    if (Object.keys(platformsList).includes(platform)) { // Early out if platform is not being tracked
        if (userDictionary[receivedMessage.author.id][platform].value != friendcode) {
            userDictionary[receivedMessage.author.id][platform].value = friendcode;
            syncUserRolePlatform(receivedMessage.member, platform, receivedMessage.guild.id);
            saveUserDictionary(receivedMessage.guild.id);
            receivedMessage.author.send(`Your ${platform} ${platformsList[platform].term} has been recorded as ${friendcode} in ${receivedMessage.guild}.`);
        } else {
            receivedMessage.author.send(`You have already recorded ${friendcode} as your ${platform} ${platformsList[platform].term} in ${receivedMessage.guild}.`)
        }
    } else {
        receivedMessage.author.send(`${platform} is not currently being tracked in ${receivedMessage.guild}.`)
    }
}


function lookupCommand(arguments, receivedMessage) {
    var userDictionary = guildDictionary[receivedMessage.guild.id].userDictionary;
    var platformsList = guildDictionary[receivedMessage.guild.id].platformsList;

    if (arguments["userMentions"].length == 1) {
        var user = arguments["userMentions"][0].user;

        if (!user.bot) {
            if (lookupOverloads.includes(arguments["words"][0])) {
                var platform = arguments["words"][1].toLowerCase();
            } else {
                var platform = arguments["words"][0].toLowerCase();
            }

            if (Object.keys(platformsList).includes(platform)) {
                if (!userDictionary[user.id] || !userDictionary[user.id][platform].value) {
                    receivedMessage.channel.send(`${user} has not set a ${platform} ${platformsList[platform].term} in this server's **DirectoryBot** yet.`);
                } else {
                    receivedMessage.author.send(`${user}'s ${platform} ${platformsList[platform].term} is ${userDictionary[user.id][platform].value}.`);
                }
            } else {
                console.log(platformsList);
                receivedMessage.author.send(`${platform} is not currently being tracked in ${receivedMessage.guild}.`)
            }
        } else {
            receivedMessage.channel.send(`${user} is a bot. Though bots do not have friend codes, Imaginary Horizons Productions definitely welcomes our coming robot overlords.`);
        }
    } else {
        var platform = "";

        if (lookupOverloads.includes(arguments["words"][0])) {
            platform = arguments["words"][1].toLowerCase();
        } else {
            platform = arguments["words"][0].toLowerCase();
        }

        if (Object.keys(platformsList).includes(platform)) {
            var text = `Here are all the ${platform} ${platformsList[platform].term}s in ${receivedMessage.guild}'s **DirectoryBot**:\n`;
            Object.keys(userDictionary).forEach(user => {
                if (userDictionary[user][platform].value) {
                    text += receivedMessage.guild.members.get(user).displayName + ": " + userDictionary[user][platform].value + "\n";
                }
            })
            receivedMessage.author.send(text);
        } else {
            receivedMessage.author.send(`${platform} is not currently being tracked in ${receivedMessage.guild}.`)
        }
    }
}


function sendCommand(arguments, receivedMessage) {
    var userDictionary = guildDictionary[receivedMessage.guild.id].userDictionary;
    var platformsList = guildDictionary[receivedMessage.guild.id].platformsList;

    if (arguments["userMentions"].length >= 1) {
        var platform = arguments["words"][1].toLowerCase();
        if (Object.keys(platformsList).includes(platform)) {
            if (userDictionary[receivedMessage.author.id] && userDictionary[receivedMessage.author.id][platform].value) {
                arguments["userMentions"].forEach(recipient => {
                    recipient.send(`${receivedMessage.author.username} has sent you ${userDictionary[receivedMessage.author.id]["possessivepronoun"].value} ${platform} ${platformsList[platform].term}. It is: ${userDictionary[receivedMessage.author.id][platform].value}`);
                })
            } else {
                receivedMessage.author.send(`You have not recorded a ${platform} ${platformsList[platform].term} in ${receivedMessage.guild}.`);
            }
        } else {
            receivedMessage.author.send(`${platform} is not currently being tracked in ${receivedMessage.guild}.`)
        }
    } else {
        receivedMessage.author.send(`Please mention someone to send your information to.`);
    }
}


function whoisCommand(arguments, receivedMessage) {
    var userDictionary = guildDictionary[receivedMessage.guild.id].userDictionary;

    if (arguments["words"].length >= 1) {
        var searchTerm = arguments["words"][1];
        var reply = `The following people have recorded ${searchTerm} in ${receivedMessage.guild.name}:`;
        Object.keys(userDictionary).forEach(user => {
            for (var platform in userDictionary[user]) {
                if (userDictionary[user][platform].value == searchTerm) {
                    reply += `\n${receivedMessage.guild.members.get(user).displayName} on ${platform}`;
                }
            }
        })

        receivedMessage.author.send(reply);
    } else {
        receivedMessage.author.send(`Please specify a username to check for.`);
    }
}


function deleteCommand(arguments, receivedMessage) {
    var userDictionary = guildDictionary[receivedMessage.guild.id].userDictionary;
    var platformsList = guildDictionary[receivedMessage.guild.id].platformsList;
    var opRole = guildDictionary[receivedMessage.guild.id].opRole;

    var platform = arguments["words"][1].toLowerCase();

    if (arguments["userMentions"].length == 1) {
        if (receivedMessage.member.hasPermission('ADMINISTRATOR') || receivedMessage.member.roles.has(opRole)) {
            if (Object.keys(platformsList).includes(platform)) {
                var target = arguments["userMentions"][0];

                if (userDictionary[target.id] && userDictionary[target.id][platform].value) {
                    userDictionary[target.id][platform] = new FriendCode();
                    target.send(`Your ${platformsList[platform].term} has been removed from ${receivedMessage.guild}.`); //TODO allow a reason to be passed
                    syncUserRolePlatform(target, platform, receivedMessage.guild.id);
                    saveUserDictionary(receivedMessage.guild.id);
                    receivedMessage.author.send(`You have removed ${target}'s ${platform} ${platformsList[platform].term} from ${receivedMessage.guild}.`);
                } else {
                    receivedMessage.author.send(`${target} does not have a ${platform} ${platformsList[platform].term} recorded in ${receivedMessage.guild}.`);
                }
            } else {
                receivedMessage.author.send(`You need a role with administrator privileges or the role ${receivedMessage.guild.roles.get(opRole)} to remove ${platformsList[platform].term}s for others.`);
            }
        } else {
            receivedMessage.author.send(`${platform} is not currently being tracked in ${receivedMessage.guild}.`)
        }
    } else {
        if (Object.keys(platformsList).includes(platform)) {
            if (userDictionary[receivedMessage.author.id] && userDictionary[receivedMessage.author.id][platform].value) {
                userDictionary[receivedMessage.author.id][platform] = new FriendCode();
                receivedMessage.author.send(`You have removed your ${platform} ${platformsList[platform].term} from ${receivedMessage.guild}.`);
                syncUserRolePlatform(receivedMessage.member, platform, receivedMessage.guild.id);
                saveUserDictionary(receivedMessage.guild.id);
            } else {
                receivedMessage.author.send(`You do not currently have a ${platform} ${platformsList[platform].term} recorded in ${receivedMessage.guild}.`);
            }
        } else {
            receivedMessage.author.send(`${platform} is not currently being tracked in ${receivedMessage.guild}.`)
        }
    }
}


function platformsCommand(receivedMessage) {
    var processedText = Object.keys(guildDictionary[receivedMessage.guild.id].platformsList).toString().replace(/,/g, ', ');

    receivedMessage.channel.send(`This server's tracked platforms are: ${processedText}`);
}


function creditsCommand(receivedMessage) {
    receivedMessage.author.send(`Version B1.1.1 <https://github.com/ntseng/DirectoryBot>\n\
__Design & Engineering__\n\
Nathaniel Tseng ( <@106122478715150336> | <https://twitter.com/Archainis> )\n\
\n\
__Engineering__\n\
Lucas Ensign ( <@112785244733628416> | <https://twitter.com/SillySalamndr> )\n\
\n\
**DirectoryBot** supporters from Patreon: https://www.patreon.com/imaginaryhorizonsproductions `);
}


function setOpRoleCommand(arguments, receivedMessage) {
    var opRole = guildDictionary[receivedMessage.guild.id].opRole;

    if (receivedMessage.member.hasPermission('ADMINISTRATOR') || receivedMessage.member.roles.has(opRole)) {
        if (arguments["roleMentions"].length > 0) {
            if (opRole != arguments["roleMentions"][0]) {
                opRole = arguments["roleMentions"][0];
                receivedMessage.author.send(`The operator role for ${receivedMessage.guild}'s **DirectoryBot** has been set to @${receivedMessage.guild.roles.get(arguments["roleMentions"][0]).name}.`);
                saveOpRole(receivedMessage.guild.id);
            } else {
                receivedMessage.author.send(`${receivedMessage.guild.name}'s operator role already is @${receivedMessage.guild.roles.get(arguments["roleMentions"][0]).name}.`);
            }
        } else {
            receivedMessage.author.send(`Please mention a role to set the ${receivedMessage.guild}'s **DirectoryBot** operator role to.`);
        }
    } else {
        receivedMessage.author.send(`You need a role with administrator privileges or the role ${receivedMessage.guild.roles.get(opRole).name} to change the operator role.`);
    }
}


function newPlatformCommand(arguments, receivedMessage) {
    var platformsList = guildDictionary[receivedMessage.guild.id].platformsList;
    var opRole = guildDictionary[receivedMessage.guild.id].opRole;

    if (receivedMessage.member.hasPermission('ADMINISTRATOR') || receivedMessage.member.roles.has(opRole)) {
        if (!platformsList[arguments["words"][1].toLowerCase()]) {
            if (arguments["words"].length > 2) { //TODO replace with improved platform construction
                receivedMessage.author.send("Please declare new platforms one at a time.");
            } else {
                if (arguments["words"].length <= 1) {
                    receivedMessage.author.send("Please provide a name for the new platform.");
                } else {
                    platformsList[arguments["words"][1].toLowerCase()] = new PlatformData();
                    receivedMessage.author.send(`${arguments["words"][1]} ${platformsList[arguments["words"][1].toLowerCase()]}s can now be recorded and retrieved.`);
                    savePlatformsList(receivedMessage.guild.id);
                }
            }
        } else {
            receivedMessage.author.send(`${arguments["words"][1]} ${platformsList[arguments["words"][1].toLowerCase()]}s can already be recorded and retrieved.`)
        }
    } else {
        receivedMessage.author.send(`You need a role with administrator privileges or the role ${receivedMessage.guild.roles.get(opRole).name} to add new platforms.`);
    }
}


function removePlatformCommand(arguments, receivedMessage) {
    var userDictionary = guildDictionary[receivedMessage.guild.id].userDictionary;
    var platformsList = guildDictionary[receivedMessage.guild.id].platformsList;
    var opRole = guildDictionary[receivedMessage.guild.id].opRole;

    if (receivedMessage.member.hasPermission('ADMINISTRATOR') || receivedMessage.member.roles.has(opRole)) {
        if (Object.keys(platformsList).includes(arguments["words"][1])) {
            platformsList.splice(Object.keys(platformsList).indexOf(arguments["words"][1]), 1);
            Object.keys(userDictionary).forEach(user => {
                delete userDictionary[user][arguments["words"][1]];
            })
            receivedMessage.author.send(`${arguments["words"][1]} will no longer be recorded in ${receivedMessage.guild}.`);
            savePlatformsList(receivedMessage.guild.id);
        }
    } else {
        receivedMessage.author.send(`You need a role with administrator privileges or the role ${receivedMessage.guild.roles.get(opRole).name} to remove platforms.`);
    }
}


function setPlatformRoleCommand(arguments, receivedMessage) {
    var userDictionary = guildDictionary[receivedMessage.guild.id].userDictionary;
    var platformsList = guildDictionary[receivedMessage.guild.id].platformsList;
    var opRole = guildDictionary[receivedMessage.guild.id].opRole;

    var role = arguments['roleMentions'][0];
    var platform = arguments['words'][1];

    if (receivedMessage.member.hasPermission('ADMINISTRATOR') || receivedMessage.member.roles.has(opRole)) {
        if (platformsList[platform].role != role) {
            platformsList[platform].role = role;
            savePlatformsList(receivedMessage.guild.id);
            Object.keys(userDictionary).forEach(user => {
                syncUserRolePlatform(receivedMessage.guild.members.get(user), platform, receivedMessage.guild.id);
            })
            saveUserDictionary(receivedMessage.guild.id);
            receivedMessage.author.send(`${receivedMessage.guild} members who set a ${platform} ${platformsList[platform].term} will now automatically be given the role @${receivedMessage.guild.roles.get(role).name}.`);
        } else {
            receivedMessage.author.send(`The role @${receivedMessage.guild.roles.get(role).name} is already associated with ${platform} in ${receivedMessage.guild}.`);
        }
    } else {
        receivedMessage.author.send(`You need a role with administrator privileges or the role ${receivedMessage.guild.roles.get(opRole)} to remove platforms.`);
    }
}


function filterMentions(messageArray, guild) { // Fetch user mentions
    var mentionArray = [];
    for (var i = 0; i < messageArray.length; i += 1) {
        if (/<@!*[0-9]+>/.test(messageArray[i])) {
            var snowflakeString = messageArray[i].replace(/\D/g, '');
            mentionArray.push(guild.members.get(snowflakeString));
        }
    }
    return mentionArray;
}

function filterRoleMentions(msgArray) { // Fetch role mention snowflakes
    var mentionArray = [];
    for (var i = 0; i < msgArray.length; i += 1) {
        if (/<@&[0-9]+>/.test(msgArray[i])) {
            mentionArray.push(msgArray[i].replace(/\D/g, ''));
        }
    }
    return mentionArray;
}

function filterWords(msgArray) { // Fetch arguments that are not mentions
    var argArray = [];
    for (var i = 0; i < msgArray.length; i += 1) {
        if (!/<@[!&]*[0-9]+>/.test(msgArray[i])) {
            argArray.push(msgArray[i]);
        }
    }
    return argArray;
}

function guildCreate(guildID) {
    participatingGuildsIDs.push(guildID);

    newGuildEntry(guildID);

    saveParticipatingGuildsIDs();
}

function newGuildEntry(guildID) {
    guildDictionary[guildID] = new GuildSpecifics();
    saveOpRole(guildID);
    savePlatformsList(guildID);
    saveUserDictionary(guildID);
}

function saveOpRole(guildID) {
    if (!fs.existsSync('./data')) {
        fs.mkdirSync('./data');
    }
    if (!fs.existsSync('./data/' + guildID)) {
        fs.mkdirSync('./data/' + guildID);
    }

    fs.readFile(`encryptionKey.txt`, 'utf8', (error, keyInput) => {
        if (error) {
            console.log(error);
        } else {
            fs.writeFile(`./data/${guildID}/opRole.txt`, encrypter.AES.encrypt(guildDictionary[guildID].opRole, keyInput).toString(), 'utf8', (error) => {
                if (error) {
                    console.log(error);
                }
            })
        }
    })
}

function saveUserDictionary(guildID) {
    if (!fs.existsSync('./data')) {
        fs.mkdirSync('./data');
    }
    if (!fs.existsSync('./data/' + guildID)) {
        fs.mkdirSync('./data/' + guildID);
    }

    fs.readFile("encryptionKey.txt", 'utf8', (error, keyInput) => {
        if (error) {
            console.log(error);
        } else {
            fs.writeFile(`./data/${guildID}/userDictionary.txt`, encrypter.AES.encrypt(JSON.stringify(guildDictionary[guildID].userDictionary), keyInput).toString(), 'utf8', (error) => {
                if (error) {
                    console.log(error);
                }
            })
        }
    })
}

function savePlatformsList(guildID) {
    if (!fs.existsSync('./data')) {
        fs.mkdirSync('./data');
    }
    if (!fs.existsSync('./data/' + guildID)) {
        fs.mkdirSync('./data/' + guildID);
    }

    fs.readFile("encryptionKey.txt", 'utf8', (error, keyInput) => {
        if (error) {
            console.log(error);
        } else {
            fs.writeFile(`./data/${guildID}/platformsList.txt`, encrypter.AES.encrypt(JSON.stringify(guildDictionary[guildID].platformsList), keyInput).toString(), 'utf8', (error) => {
                if (error) {
                    console.log(error);
                }
            })
        }
    })
}

function saveParticipatingGuildsIDs() {
    var guildsListOutput = { "list": participatingGuildsIDs };

    fs.readFile(`encryptionKey.txt`, `utf8`, (error, keyInput) => {
        if (error) {
            console.log(error);
        } else {
            fs.writeFile(`guildsList.txt`, encrypter.AES.encrypt(JSON.stringify(guildsListOutput), keyInput), 'utf8', (error) => {
                if (error) {
                    console.log(error);
                }
            })
        }
    })
}

function syncUserRolePlatform(member, platform, guildID) {
    if (guildDictionary[guildID].userDictionary[member.id]) {
        if (guildDictionary[guildID].platformsList[platform].role) {
            if (guildDictionary[guildID].userDictionary[member.id][platform].value) {
                member.addRole(guildDictionary[guildID].platformsList[platform].role);
            } else {
                member.removeRole(guildDictionary[guildID].platformsList[platform].role);
            }
        }
    }
}
