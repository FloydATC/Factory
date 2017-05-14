
function(context, args)
{
	var caller = context.caller;
	var l = #s.scripts.lib();
	var m = #s.include.math();
	let out = [];


	let bots = {
		nanobots:    { cost:"1" },
		microbots:   { cost:"10" },
		minibots:    { cost:"100" },
		midibots:    { cost:"1000" },
		maxibots:    { cost:"10000" },
		megabots:    { cost:"100000" },
		gigabots:    { cost:"1000000" },
		terabots:    { cost:"10000000" },
		petabots:    { cost:"100000000" },
		exabots:     { cost:"1000000000" },
		zettabots:   { cost:"10000000000" },
		yottabots:   { cost:"100000000000" },
		superbots:   { cost:"1000000000000" },
		ultrabots:   { cost:"10000000000000" },
		hyperbots:   { cost:"100000000000000" },
		metabots:    { cost:"1000000000000000" },
		clusterbots: { cost:"10000000000000000" },
		unibots:     { cost:"100000000000000000" },
		alicebots:   { cost:"1000000000000000000" },
		cakebots:    { cost:"10000000000000000000" },
	};

	#db.r({ script:'factory', file:'bots' });
	#db.i({ script:'factory', file:'bots', obj:bots });

	let strings = {};

	strings['restart_confirm'] = [
		'`AATTENTION!` Restarting the game will double your nanite multiplier for free',
		'but everything else will be reset to 0. Please confirm with `Nconfirm`:`Vtrue`',
	];

	strings['restart_deny'] = [
		"`DWhy would you even want to restart at this time? There will be cake!`",
	];

	strings['restart_done'] = [
		'`LYou restarted the game and doubled your nanite multiplier for free. Congratulations!`',
	];

	strings['restart_info'] = [
		'',
		'`JYou have beaten the game and have the option to restart and double your nanite multiplier for free!`',
		'`JYour current nanobots will be added to your legacy and shown in the leaderboard for all time.`',
		'device.factory { restart:true }',
	];

	strings['bonus_done'] = [
		'You have received a free bonus gift:',
	];

	strings['bonus_info'] = [
		'',
		'`JYou have been awarded a free daily bonus! Redeem with` device.factory { bonus:true }',
	];

	strings['reset_confirm'] = [
		"This will delete your device.factory data, including any purchases. Please confirm:true",
	];

	strings['lb_header'] = [
		'',
		'Rank  Player                           Total robot value      Legacy',
	];

	strings['lb_footer'] = [
		'',
		'`bLegacy: Number of nanobots accumulated across restarts, ie. after beating the game.`',
	];

	strings['help'] = [
		"This game lets you create robots that automatically create smaller robots.",
		"Creating a bigger robot consumes a number of smaller robots plus nanites.",
		"You earn free nanites over time, and you can buy multipliers to speed things up.",
		"",
		"To view detailed information about a robot type, upgrade it and more, use for example",
		"device.factory { info:\"nanobots\" }",
		"",
		"You can also attack other players if they have a device.factory",
		"Recycle their robots into nanites to help boost your own ranks!",
		"Example: device.factory { attack:\"playername\", nanobots:1000 }",
		"",
		"Keep in mind that you need to send an attack force large enough to",
		"penetrate your opponent's defenses but small enough to make a net profit.",
		"",
		"Want to see how well you're doing compared to other players?",
		"device.factory { info:\"leaderboard\" }",
		"",
		"Good luck!",
	];

	strings['nanobot_lore'] = [
		'The nanobot is your lowest tier of robots, they do not produce anything.',
		'They are, however, incredibly useful for attacking other players with!',
	];

	strings['ad_math'] = [
		'',
		'The game now uses include.math for UNLIMITED arithmetics everywhere.',
	];

	strings['ad_factory'] = [
		// Note: One line only!
		"Hi! I'm playing device.factory, a FULLSEC Free-to-Play incremental multiplayer game about building robots that build robots, and I want you to join too!"
	];

	strings['warp_done'] = [
		'`JYour factory turns completely silent for a brief moment,`',
		'`Jbefore a high pitched thunder rips every last one of your robots out of existence.`',
		'',
		'`JYou have successfully distorted time within your factory.`',
	];

	strings['warp_confirm'] = [
		// 'By converting the mass of your '+hrc(owned.nanobots, 'nanobots')+' into energy,'
		'you can distort the passage of time within your factory in a way that will',
		'effectively speed up production of both robots and nanites.',
		'',
		'Attacking other players and defending against attacks will not be affected.',
		'',
		'`bDISCLAIMER: Possible side-effects include headache, light nausea and/or dizziness. There have been unsubstantiated claims of all robots within affected factories being annihilated in the process. By confirming, you agree to take full responsibility for any consequences of tampering with reality.`',
		'',
		'This should be perfectly safe but as a formality, please confirm:true',
	];

	strings['warp_deny'] = [
		// 'Sorry, your '+hrc(owned.nanobots, 'nanobots')+' would not generate enough energy to do any good.'
		'Produce more and then try again.',
	];

	strings['warp_info'] = [
		'',
		'`JYou have enough nanobots to convert them into energy with` device.factory { warp:true }',
	];

	strings['attack_self'] = [
		'You attacked yourself and lost.',
	];

	strings['bots_header'] = [
		'',
		'`PRobot type                    Owned  Create maximum`',
	];

	strings['bots_footer'] = [
		'`bOptional: include` `Nxfer:``V#s.`accts.xfer_gc_to `bto avoid using` escrow.confirm',
		'`bFor help on things like pvp, upgrades etc., use` device.factory { help:true }',
		'`bRefresh with` device.factory {}',
	];


	#db.r({ script:'factory', file:'strings' });
	#db.i({ script:'factory', file:'strings', obj:strings });

	return { ok:true };
}
