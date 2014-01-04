trading-card-squatter for Steam
===============================

This bot will log onto your Steam account, grab the "badges" page, and figure out how many card drops you have left for each game.

Then it will automatically tell Steam's servers that it's playing the first game on the list, waiting for you to receive all your drops for that game. It'll move on to the next game on the list and continue until it's out of games.

This is meant to be run once overnight or something, because interaction with Steam while you're using the bot might not end well. The bot does not perform any analysis on your inventory to check that the items that appear in your inventory are actually trading cards, so anything else you do to trigger a "new item" notification (Community Market purchases, crafting badges, etc.) will confuse the bot and make it think you got a card drop. If something like that happens, just restart the bot. The bot *is* tolerant of you clearing your item notifications, though, so if you feel the need to peek at your inventory you won't have to worry about messing anything up.

If the bot loses connection to Steam, node-steam will automatically reconnect it.

I haven't actually checked to see if this sort of thing is *allowed* by Valve, or anything like that. I mostly wrote this for fun and only received card drops from it to test it. Personally I think it's more fun to receive them from playing the games anyway. Don't hold me responsible for whatever happens to your account for automating the trading card drop process.

Dependencies
------------

This program is written in node.js.

* [node-steam](https://github.com/seishun/node-steam) by Nikolai Vavilov is requried to run the bot; this is what does most of the 	work with logging onto Steam.
* [request](https://github.com/mikeal/request) by Mikeal Rogers is used to grab the "badges" page.
* [cheerio](https://github.com/MatthewMueller/cheerio) by Matthew Mueller is used to parse the "badges" page.

License
-------

The bits that I've distributed here (i.e. not the dependencies) are released under the MIT License. Have fun!