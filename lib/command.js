var Readline, Slack;

Slack = require('..');

Readline = require('readline');

module.exports = function(args) {
  var rl, shutdown, slack, token;
  token = args[2];
  console.log("TOKEN: " + token);
  if (!token) {
    console.error("Token is required");
    return process.exit(1);
  } else {
    shutdown = false;
    slack = new Slack(token, true, true);
    rl = Readline.createInterface(process.stdin, process.stdout);
    slack.on('error', function(error) {
      return console.error("Error: %s", error);
    });
    slack.on('open', function() {
      var channel, channels, group, groups, k, unreads;
      console.log("Welcome to Slack. You are %s of %s", slack.self.name, slack.team.name);
      channels = [];
      for (k in slack.channels) {
        channel = slack.channels[k];
        if (channel.is_member) {
          channels.push('#' + channel.name);
        }
      }
      console.log("You are in: %s", channels.join(', '));
      groups = [];
      for (k in slack.groups) {
        group = slack.groups[k];
        if (group.is_open && !group.is_archived) {
          groups.push(group.name);
        }
      }
      if (groups.length) {
        console.log("As well as: %s", groups.join(', '));
      }
      unreads = slack.getUnreadCount();
      if (unreads !== 0) {
        console.log("You have %d unreads", unreads);
      }
      rl.setPrompt('> ', 2);
      return rl.prompt();
    });
    slack.on('close', function() {
      return console.warn('Disconnected!');
    });
    slack.on('message', function(message) {
      var str;
      str = message.toString();
      if (str) {
        return console.log(str);
      }
    });
    rl.on('line', function(line) {
      var channel, cmd, name, rest, text;
      cmd = line.split(' ', 1);
      rest = line.replace(cmd[0], '').trim();
      switch (cmd[0]) {
        case "/msg":
          if (rest != null) {
            name = rest.split(' ', 1);
            text = rest.replace(name, '').trim();
            channel = slack.getChannelGroupOrDMByName(name[0]);
            if (!channel) {
              console.log("Could not find channel '%s'", name[0]);
            } else if (!text) {
              console.log("Need something to send!");
            } else {
              console.log("Sending '%s' to '%s'", text, name[0]);
              channel.send(text);
            }
          } else {
            console.log("Sorry, what? Try /help");
          }
          break;
        case "/quit":
          rl.close();
          return;
        case "/join":
          if (rest != null) {
            slack.joinChannel(rest);
          } else {
            console.log("Need a channel name to join");
          }
          break;
        case "/leave":
          if (rest != null) {
            channel = slack.getChannelGroupOrDMByName(rest);
            if (!channel) {
              console.log("Could not find channel '%s'", rest);
            } else {
              channel.leave();
            }
          } else {
            console.log("Need a channel name to leave");
          }
          break;
        case "/help":
          console.log('Commands:');
          console.log('/msg channel text');
          console.log('/join channel');
          console.log('/leave channel');
          console.log('/quit');
          break;
        default:
          console.log("Sorry, what? Try /help");
      }
      rl.setPrompt('> ', 2);
      return rl.prompt();
    });
    rl.on('close', function() {
      console.log('Shutting down...');
      shutdown = true;
      return slack.disconnect();
    });
    return slack.login();
  }
};
