# DirectoryBot
DirectoryBot is a Discord bot that stores friend codes and converts timezones.

## Set-Up
1. Add DirectoryBot to your server from this link: https://discord.com/api/oauth2/authorize?client_id=585336216262803456&permissions=27648&scope=bot
2. Move the DirectoryBot role above any roles you'd like it to be able to automatically add (new roles get added at the bottom)

### Optional
* Use "@DirectoryBot setpermissionsrole (role)" to store the permissions role. This allows the bot to interpret accidental mentions of the role as command messages.
* Use "@DirectoryBot setmanagerrole (role)" to set up a manager role. Bot managers are allowed to use manager-only commands without Discord administrator permissions.
* Use "@DirectoryBot welcomemessage (welcome message)" to set a message to send to new server members.
* Record your information for DirectoryBot's default platforms: time zone, possessive pronoun, and stream.
* Check out the Imaginary Horizons Productions Patreon: https://www.patreon.com/imaginaryhorizonsproductions

### Notes
If you leave a server, DirectoryBot will delete all of your data. If you kick DirectoryBot, it will delete everyone's data.

## Commands
#### help (AKA: commands)
Syntax: `@DirectoryBot help`
\
Lists all DirectoryBot's commands that are accessible to you and summaries of their functions.

Syntax: `@DirectoryBot help (command)`
\
Explains the (command) and provides a syntax example.

#### record (AKA: log)
Syntax: `@DirectoryBot record (platform) (information)`
\
Stores your (platform) (information). For example `@DirectoryBot timezone America/Los_Angeles` would have DirectoryBot record "America/Los_Angeles" as your entry for "timezone". The message with this command will be deleted for security purposes. Discord's spoilers markdown (|| on both sides) is removed from code entry to allow hiding entry from mobile via spoilers markdown.

#### import
Syntax: `@DirectoryBot import (channel mention or server snowflake)`
\
The import command copies your information for matching platforms from a given server. There are two ways to indicate which server to import from: by mentioning a channel from that server, or by mentioning the server's snowflake.

To get a channel mention, start a message in the server you want to import from. Start with #, then autocomplete. You can then copy-paste the blue link into your command in the destination server.

To get a server's snowflake, first activate Developer Mode in your User Settings. Then you can right-click on the source server and select "Copy ID" from the drop-down menu.

#### send (AKA: tell)
Syntax: `@DirectoryBot send (user) (platform)`
\
Private messages the (user) with your information for the (platform).

#### lookup
Syntax: `@DirectoryBot lookup (platform)`
\
Tells you everyone's information associted with the given platform.

Syntax: `@DirectoryBot (platform) (user set)`
\
You can limit your results to a set of users by mentioning them at the end of the command.

#### myentries (AKA: mydata)
Syntax: `@DirectoryBot myentries`
\
Private messages the user with the information they've input into DirectoryBot.

#### whois
Syntax: `@DirectoryBot whois (username)`
\
Checks if anyone uses the given username and private messages you the result.

#### delete (AKA: remove, clear)
Syntax: `@DirectoryBot delete (platform)`
\
Deletes the information for the sender in (platform).

#### block
Syntax: `@DirectoryBot block (user)`
\
Prevents the mentioned user from looking up your data.

#### platforms
Syntax: `@DirectoryBot platforms`
\
States a list of platforms currently tracked by DirectoryBot.

#### support
Syntax: `@DirectoryBot support`
\
Lists ways to support DirectoryBot development.

#### creditz (AKA: credits, about)
Syntax: `@DirectoryBot credits`
\
Lists version info and contributors.

### Time Module
The time module contains commands for converting time zones, which users can store in the default platform "timezone".
#### convert
Syntax: `@DirectoryBot convert (time) in (timezone) for (user)`
\
States the (time) in (timezone1) as its equivalent for (user) based on (user)'s declared timezone. (timezone) defaults to the sender's time zone, then DirectoryBot's time zone after that.

Syntax: `@DirectoryBot convert (time) in (timezone1) to (timezone2)`
\
States the (time) in (timezone1) as its equivalent in (timezone2). (timezone) defaults to the sender's time zone, then DirectoryBot's time zone after that.

#### countdown
Syntax: `@DirectoryBot countdown (time) in (timezone)`
\
States how long until (time) in (timezone). (timezone) defaults to the sender's time zone, then DirectoryBot's time zone after that.

### Streaming Module
The streaming module contains commands for supporting live-streamers.
#### multistream (AKA: multitwitch)
Syntax: `@DirectoryBot multistream (list of users) (layout)`
\
Generates a multistre.am link for all (user)s based on the users' recorded Twitch accounts with the specified (layout).

#### shoutout (AKA: streamshoutout)
Syntax: `@DirectoryBot shoutout (user)`
\
Posts a link to the user's stream!

### Bot Manager Commands
The following commands can only be used by server members who have Discord administrator privledges or the role determined by **setmanagerrole**.
#### permissionsrole (AKA: setpermissionsrole)
Syntax: `@DirectoryBot permissionsrole (role)`
\
Stores DirectoryBot's permissions role, allowing DirectoryBot to interpret accidental mentions of the role as command messages. If no role is given, the setting will be cleared.

#### managerrole (AKA: setmanagerrole)
Syntax: `@DirectoryBot managerrole (role)`
\
Sets the manager role for DirectoryBot. Users with that role can use the manager-only commands without Discord administrator privileges. If no role is given, the setting will be cleared.

#### welcomemessage
Syntax: `@DirectoryBot welcomemessage (welcome message)`
\
Sets a message to send to new members of the server.

#### infolifetime
Syntax: `@DirectoryBot infolifetime (number of hours)`
\
Sets the amount of time in hours before responses from the `lookup` and `send` commands expire (decimals allowed).

#### newplatform (AKA: addplatform)
Syntax `@DirectoryBot newplatform (platform)`
\
Adds (platform) to the list of tracked platforms, allowing users to add their information for that platform. Optionally, you can set a term to call the information that is being stored (default is "username"). Additionally, you can set an optional description to be displayed when the lookup command is used on the platform.

#### setplatformterm (AKA: changeplatformterm)
Syntax: `@DirectoryBot setplatformterm (platform) (term)`
\
Changes what DirectoryBot calls information from the given platform (default is "username").

#### setplatformrole
Syntax: `@DirectoryBot setplatformrole (platform) (role)`
\
Associates (role) with (platform) so that whenever a user adds information for (platform), they'll be given (role) automatically.

#### removeplatform
Syntax: `@DirectoryBot removeplatform (platform)`
\
Removes (platform) from the list of tracked platforms.

#### delete (for other users)
Syntax: `@DirectoryBot delete (platform) (user)`
\
Deletes the friend code for (user) in (platform).
