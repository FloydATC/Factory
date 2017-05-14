function(context, args)
{
	var caller = context.caller;
	var l = #s.scripts.lib();
	var m = #s.include.math();
	let out = [];
	let payment_rcpt = 'device';
	if (args == null || (args && args.info)) {
		out.push(#s.lodash.logo({ s:'`Cdevice`.`Lfactory`' }));
		out.push("");
	}

	let bots = #db.f({ script:'factory', file:'bots' }).first().obj;
  	let strings = #db.f({ script:'factory', file:'strings' }).first().obj;


	//if (caller != 'device' && caller != 'lodash') {
	//	out.push('The game is closed for maintenance, sorry for the inconvenience.\nPlease try again in a few moments.');
	//	return out;
	//}

	//return JSON.stringify(strings);

	if (safe_caller() == false) return { ok:false, msg:"For security, please use your own automation script" };

	if (caller == 'device' && args && args.as) {
		caller = args.as;
		out.push('`DWARNING: Playing as '+caller+', changes will NOT be saved!`');
	}


	let gamestate = #db.f({ script:'factory', player:caller }).first();
	//out.push('res='+JSON.stringify(gamestate));
	let owned = { nanobots:"1", nanites:"0", multiplier:1 };
	let log = [];
	if (gamestate && gamestate._id) {
		//owned = gamestate.owned;
		if (gamestate.log && gamestate.log.length > 0) {
			for (let i in gamestate.log) {
				let event = gamestate.log[i];
				out.push(l.to_game_timestr(event.t)+' '+event.msg);
			}
			gamestate.log = [];
		}
		// Is l.get_date_utcsecs() a different day than gamestate.t?
		if (gamestate.t && yesterday(gamestate.t)) gamestate.owned.bonus = true;
		//let delta = l.math.floor((l.get_date_utcsecs() - gamestate.t) / 1000);
		//out.push('delta='+delta);
		let debug = false;
		if (context.caller == 'device') debug = true;
		// Update game state
		recalc(gamestate, debug);
		//return { log:log, debug:gamestate };
		owned = gamestate.owned;
	}
	//return { ok:false, msg:out };

	if (args) {

		// Free spin?
		if (args.bonus === true && owned.bonus === true) {
			out=out.concat(strings['bonus_done']);
			let r = l.rand_int(1,5);
			//out.push('r='+r);
			switch (r) {
				case 1: {
					//out.push('player has '+owned.nanites+' nanites');
					let n = m._multiply(owned.nanites, "2");
					owned.nanites = m._add(owned.nanites, n);
					out.push('`F'+hrn(n)+'` nanites'); break;
				}
				case 2: {
					//out.push('player has '+owned.nanites+' nanites');
					let n = m._multiply(owned.nanites, "10");
					owned.nanites = m._add(owned.nanites, n);
					out.push('`F'+hrn(n)+'` nanites'); break;
				}
				case 3: {
					let bot = top_owned(owned);
					//out.push('player has '+owned[bot]+' '+bot);
					let n = m._multiply(owned[bot], "2");
					owned[bot] = m._add(owned[bot], n);
					out.push(hrc(n, bot)); break;
				}
				case 4: {
					let bot = top_owned(owned);
					//out.push('player has '+owned[bot]+' '+bot);
					let n = m._multiply(owned[bot], "10");
					owned[bot] = m._add(owned[bot], n);
					out.push(hrc(n, bot)); break;
				}
			}
			owned.bonus = false;
		}

		// Got cake? Restart for free nanite multiplier upgrade
		if (args.restart == true) {
			//if (caller != 'device') return "Hang on, this feature is being tested. Please try again in a few moments.";
			if (m._gt(owned.cakebots, "0")) {
				if (args.confirm == true) {
				    out=out.concat(strings['restart_done']);
					let multiplier = (owned.multiplier || 1) * 2;
					let restarts = (owned.restarts || 1);
					let legacy = m._add(owned.nanobots, (owned.legacy || "0"));
					gamestate.owned = { nanobots:"1", nanites:"0", multiplier:multiplier, restarts:restarts, legacy:legacy };
					recalc(gamestate);
					owned = gamestate.owned;
				} else {
					out=out.concat(strings['restart_confirm']);
					return out;
				}
			} else {
				out=out.concat(strings['restart_deny']);
			}
		}
		//return out;

		if (args.reset == true) {
			if (args.confirm == true) {
				#db.r({ script:'factory', player:context.caller });
				return "Game reset.";
			} else {
				out=out.concat(strings['reset_confirm']);
			}
		}

		// SHow leaderboard
		if (args.info == 'leaderboard') {
			let unsorted = #db.f({ script:'factory' }).array();
			for (let i in unsorted) {
				recalc(unsorted[i]);
				if (unsorted[i].player == 'device') unsorted[i].score = "0";
			}
			let res = unsorted.sort( function(a,b) { return m._cmp(b.score, a.score) } );
			//out.push('res='+JSON.stringify(res));
			let found = false;
			out=out.concat(strings['lb_header']);
			for (let i in res) {
				let acct = res[i];
				if (acct.player != caller) {
					acct.color = 'C';
					if (caller != 'device') acct.player = '????????'
				} else {
					acct.color = 'L';
				};
				if ((found == false && acct.player == caller) || i < 10) {
					out.push(
						'`'+acct.color+
						(' '.repeat(3)+(i*1+1)).substr(-4)+
						'  '+
						(acct.player+(' '.repeat(32))).substr(0, 32)+
						' '+
						w(hrn(acct.score),22)+
						'` '+
						(acct.owned.legacy ? '`J'+hrn(acct.owned.legacy)+'`' : '')+
						''
					);
				}
				if (acct.player == caller) found = true;
				//out.push('device.factory { attack:"'+acct.player+'", with:'+owned.nanobots+' }');
			}
			out=out.concat(strings['lb_footer']);
			return out;
		}

		if (args.help == true) {
			out=out.concat(strings['help']);
			return out;
		}

		if (args.info) {
			if (bots[args.info] == null) { return 'Sorry, there is no available info about '+args.info; }
			let bot_s = args.info;
			let sub_s = sub_unit(args.info) || "";
			let sup_s = sup_unit(args.info);
			let bot = bot_s.substring(0,bot_s.length-1);
			let sub = (sub_s ? sub_s.substring(0,sub_s.length-1) : '');
			let sup = (sup_s ? sup_s.substring(0,sup_s.length-1) : '');
			let e = owned[args.info+'_e'] || "0";
			let c = owned[args.info+'_c'] || "0";
			let p2c = m._pow2(c);
			let p2e = m._pow2(e);
			let p10c = "1"+"0".repeat(c);
			let p10e = "1"+"0".repeat(e);
			if (sub) {
				out.push('About '+bot_s+':\n');
				out.push('Each of your '+bot_s+' currently produces '+hrc(p2e, sub_s)+' per '+tick(owned.warp)+'.');
				out.push('Doubling the efficiency will cost '+hrc(p10e, bot_s)+'.');
				out.push('You have '+hrc(owned[bot_s], bot_s)+'.');
				out.push('Upgrade with device.factory { efficiency:"'+bot_s+'", count:1 }');
				//out.push('\nManually creating '+l.math.pow(2,c)+' '+(l.math.pow(2,c)==1?bot:bot_s)+' requires '+bots[args.info].cost+' '+sub_s+' and nanites at this time.');
				let cost = bots[bot_s].cost;
				out.push('\nManually creating '+hrc(p2c, bot_s)+' requires '+hrc(cost, sub_s)+' and '+hrc(cost, 'nanites')+' at this time.');
			} else {
				out=out.concat(strings['nanobot_lore']);
				if (m._gt(owned[bot_s], "1e+12")) {
					out.push('');
					out.push('You have exactly `B'+owned[bot_s]+'` nanobots.');
				}
				out.push('\nManually creating '+hrc(p2c, bot_s)+' requires 1 nanite.');
			}
			//return "`DThis is UNAVAILABLE for maintenance, please try again in a few moments`";
			if (sup_s) {
				out.push('Doubling the number of clones will cost '+hrc(p10c, sup_s)+'.');
				out.push('This upgrade will effectively cut the price per '+bot+' in half.');
				out.push('You have '+hrc(owned[sup_s], sup_s)+'.');
				out.push('Upgrade with device.factory { cloning:"'+bot_s+'", count:1 }');
			}
			//return "`DThis is UNAVAILABLE for maintenance, please try again in a few moments`";
			if (sup_s && owned[sup_s] != "0") {
				let sup_e = owned[sup_s+'_e'] || "0";
				let free = m.f_multiply(owned[sup_s], m._pow2(sup_e));
				out.push('\nYour '+hrc(owned[sup_s], sup_s)+' currently produce a total of '+hrc(free, bot_s)+' per '+tick(owned.warp)+'.');
			} else {
				out.push('\nYou are not producing any '+bot_s+' at this time.');
			}
			out=out.concat(strings['ad_math']);
			return out;
		}

	}

	//if (caller == 'device') {
	//	log.push({ t:new Date(), msg:'TEST MESSAGE #1' });
	//	log.push({ t:new Date(), msg:'TEST MESSAGE #2' });
	//}

	// Upgrade looping
	let loops = 1;
	if (args && args.count) loops = l.math.floor(args.count);
	for (let loop=0; loop<loops; loop++) {
	    // Handle robot upgrades
		if (args && args.cloning) {
			let c = owned[args.cloning+'_c'] || 0;
			let p10c = "1"+"0".repeat(c);
			let sup = sup_unit(args.cloning);
			let sub = sub_unit(args.cloning);
			//if (sup != null && sub != null) {
			if (sup != null) {
				out.push('Attempting to upgrade cloning of '+args.cloning+'.');
				owned[sup] = m._int(owned[sup]);
				//out.push('owned='+JSON.stringify(owned[sup])+' p10c='+JSON.stringify(p10c));
				if (m._cmp(owned[sup], p10c) != -1) {
					c = c + 1;
					let p2c = m._pow2(c);
					owned[args.cloning+'_c'] = c;
					owned[sup] = m._subtract(owned[sup], p10c);
					if (sub == null) {
						//out.push('You can now create '+l.math.pow(2,c)+' '+args.cloning.substr(0,args.cloning.length-1)+(l.math.pow(2,c)==1?'':'s')+' for 1 nanite.');
						out.push('You can now create '+hrc(p2c, args.cloning)+' for 1 nanite.');
					} else {
						//out.push('You can now create '+l.math.pow(2,c)+' '+args.cloning.substr(0,args.cloning.length-1)+(l.math.pow(2,c)==1?'':'s')+' for 1 '+sub.substr(0,sub.length-1)+' and nanite.');
						let cost = m._int(bots[args.cloning].cost);
						out.push('You can now create '+hrc(p2c, args.cloning)+' for '+hrc(cost, sub)+' and '+hrc(cost, 'nanites')+'.');
					}
					out.push('This upgrade consumed '+hrc(p10c, sup)+'.');
				} else {
					out.push('Sorry, that upgrade costs '+hrc(p10c, sup)+'.');
					out.push('You currently have '+hrn(owned[sup])+'.');
					break;
				}
			} else {
				out.push('Error: Can not upgrade cloning of '+args.cloning+' at this time.');
				break;
			}
		}
	}
	for (let loop=0; loop<loops; loop++) {
		if (args && args.efficiency) {
			let e = owned[args.efficiency+'_e'] || 0;
			let p10e = m._pow10(e); // cost = 10^e
			let p2e = m._pow2(e); // effect = 2^e
			let sub = sub_unit(args.efficiency);
			//if (caller == 'device') out.push('e='+hrn(e)+'\np2e='+hrn(p2e)+'\np10e='+hrn(p10e));
			if (sub != null) {
				out.push('Attempting to upgrade efficiency of '+args.efficiency+'.');
				if (m._cmp(owned[args.efficiency], p10e) != -1) {
					e = e + 1;
					owned[args.efficiency+'_e'] = e;
					owned[args.efficiency] = m._subtract(owned[args.efficiency], p10e);
					out.push('Each of your '+args.efficiency+' will now produce '+hrn(p2e)+' free '+sub+' per '+tick(owned.warp)+'.');
					//out.push('This upgrade consumed '+cost+' '+args.efficiency.substr(0,args.efficiency.length-1)+(cost==1?'':'s')+'.');
					out.push('This upgrade consumed '+hrc(p10e, args.efficiency)+'.');
				} else {
					//out.push('Sorry, that upgrade costs '+cost+' '+args.efficiency.substr(0,args.efficiency.length-1)+(cost==1?'':'s')+'.');
					out.push('Sorry, that upgrade costs '+hrc(p10e, args.efficiency)+'.');
					out.push('You currently have '+hrn(owned[args.efficiency])+'.');
					break;
				}
			} else {
				out.push('Error: Can not upgrade efficiency of '+args.efficiency+' at this time.');
				break;
			}
		}
	}

	// Handle nanite purchases
	if (args && args.double == true) {
		let cost = l.math.ceil((owned.multiplier||1)/l.math.PI);
		if (args.xfer && args.xfer.name === 'accts.xfer_gc_to' && typeof(args.xfer.call) === 'function') {
			if (context.calling_script || context.is_scriptor) return { ok:false, msg:'Please try again directly from the command line' }
			// Use scriptor
			let res = args.xfer.call({ amount:cost, to:payment_rcpt });
			if (res == null) return { ok:false, msg:'Please try again without any funny tricks' };
			if (res.ok == false) return res;
		} else {
			// Use escrow
			let result = #s.escrow.charge({ cost:cost, is_unlim:false });
			if (result) return result;
		}
		owned.multiplier = (owned.multiplier || 1) * 2;
		out.push('You doubled the nanite production for '+l.to_gc_str(cost));
	}

	// Handle warp events
	if (args && args.warp) {
		if(can_warp(owned)) {
			if (args.confirm == true) {
				out=out.concat(strings['warp_done']);
				owned.warp = owned.nanobots.length;
				for (let types in bots) owned[types] = "0";
			} else {
				out.push('By converting the mass of your '+hrc(owned.nanobots, 'nanobots')+' into energy,');
				out=out.concat(strings['warp_confirm']);
				return out;
			}
		} else {
			out.push('Sorry, your '+hrc(owned.nanobots, 'nanobots')+' would not generate enough energy to do any good.');
			out=out.concat(strings['warp_deny']);
		}
	}

	//if (owned.nanites == '') owned.nanites = "0"; // Bughunt 2017-03-16

	// Handle build/destroy orders
	if (args && !args.attack) {
		let types = Object.keys(bots);
		for (let i=types.length-1; i>=0; i--) {
			if (args[types[i]]) {
				//out.push('*='+args[types[i]]);
				let c = m._int(args[types[i]]);
				//out.push('c='+c);
				if (m._is_neg(c)) {
					out.push(destroy(owned, types[i], c));
				} else {
					out.push(create(bots, owned, types[i], c, 'nanites', (i > 0 ? types[i-1] : null) ));
				}
			}
		}
	}
	//if (owned.nanites == '') owned.nanites = "0"; // Bughunt 2017-03-16

	// Handle attacks
	//if (args && args.attack && l.is_str(args.attack)) {
	//	out.push('`DSorry, PVP is unavailable at the moment due to maintenance, please try again later.`');
	//}
	if (args && args.attack && l.is_str(args.attack)) {
		//if (caller != 'lodash' && caller != 'device') return "`DSorry, pvp is unavailable because of testing, please try again in a few moments`";
		// Load target player
		let target = #db.f({ script:'factory', player:args.attack }).first();
		if (target && target.owned) {
			if (!target.log) target.log = [];
			if (target.t && yesterday(target.t)) target.owned.bonus = true;
			recalc(target);
			// Determine attacking force
			let attack_force = "0";
			let types = Object.keys(bots);
			for (let i=types.length-1; i>=0; i--) {
				if (args[types[i]]) {
					let count = m._abs(m._int(args[types[i]]));
					if (m._gt(count, "0")) {
						if (m._gt(count, owned[types[i]])) count = owned[types[i]];
						owned[types[i]] = m._subtract(owned[types[i]], count);
						let effect = ((l.math.random()*0.10)+0.80); // (double float)
						//let cost = m._pow2(bots[types[i]].cost.length); // 10^n => 2^n for diminishing returns
						let cost = bots[types[i]].cost; // (double float)
						let cpu = m.f_multiply(effect, cost); // Cost per unit (double float)
						let nanites = m.int(m.f_multiply(count, cpu));
						//out.push('Attacking '+args.attack+' with '+count+' '+types[i]+' force='+nanites);
						attack_force = m._add(attack_force, nanites);
					}
				}
			}
			//out.push('Total attack force is '+attack_force);
			// Determine defending force
			let defence_force = "0";
			if (attack_force != "0") {
				for (let i=types.length-1; i>=0; i--) {
					let count = target.owned[types[i]];
					if (count > 0) {
						let effect = ((l.math.random()*0.10)+0.80); // (double float)
						//let cost = m._pow2(bots[types[i]].cost.length); // 10^n => 2^n for diminishing returns
						let cost = bots[types[i]].cost; // (double float)
						let cpu = m.f_multiply(effect, cost); // Cost per unit (double float)
						let nanites = m.int(m.f_multiply(count, cpu));
						//out.push('Defender has '+count+' '+types[i]+' force='+nanites);
						defence_force = m._add(defence_force, nanites);
					}
				}
			}
			//out.push('Total defence force is '+defence_force);
			// Calculate defender losses
			let ratio = m.divide(attack_force.length, defence_force.length, 8);
			//out.push('Attacker/defender ratio is '+ratio);
			if (ratio > 0.9) { ratio = 0.9; } // Cap the losses
			let loot = attack_force;
			//out.push('Defender will lose '+ratio+' of 1 defending unit');
			for (let i=types.length-1; i>=0; i--) {
				//let defending = m._divide(target.owned[types[i]], "2");
				let defending = m.f_multiply(target.owned[types[i]], "0.4");
				let loss = m.int(m.f_multiply(defending, (ratio <= 1 ? ratio : 1)));
				target.owned[types[i]] = m._subtract(target.owned[types[i]], loss);
				let effect = (l.math.random()*0.10)+0.80; // (double float)
				//let cost = m._pow2(bots[types[i]].cost.length); // 10^n => 2^n for diminishing returns
				let cost = bots[types[i]].cost; // (double float)
				let lpu = m.f_multiply(effect, cost); // loot per unit (double float)
				let nanites = m.int(m.f_multiply(loss, lpu));
				//out.push('Defender loses '+loss+' '+types[i]+' value='+nanites);
				loot = m._add(loot, nanites);
			}
			//out.push('The total loot is '+loot+' nanites');
			// Scale the loot to attack size - Credit: @kuberoot
			let a = -0.1316046332677404;
			let b = -28.6015645576843;
			let c = 29.6015645576843;
			let lm = l.math.pow(loot.length,a)*b+c;
			loot = loot.substr(0,lm);
			let attacker_loot = loot.substr(0, l.math.ceil(loot.length * attack_force.length / defence_force.length) ) || "0";
			if (m._gt(attacker_loot, loot)) attacker_loot = loot;
			let defender_loot = loot.substr(0, l.math.ceil(loot.length * defence_force.length / attack_force.length) ) || "0";
			if (m._gt(defender_loot, loot)) defender_loot = loot;
			if (args.attack == caller) {
				out=out.concat(strings['attack_self']);
			} else {
				out.push('You attacked '+args.attack+' and received `F'+hrn(attacker_loot)+'` nanite'+(attacker_loot=="1"?'':'s')+'!');
				owned.nanites = m._add(owned.nanites, attacker_loot);
				target.log.push({ t:new Date(), msg:'You were attacked by '+caller+' and received `F'+hrn(defender_loot)+'` nanite'+(defender_loot==1?'':'s')+'!' });
				target.owned.nanites = m._add(target.owned.nanites, defender_loot);
				// Update target player
				let t = l.get_date_utcsecs();
				#db.u({ script:'factory', player:args.attack }, { $set:{ owned:target.owned, t:t, log:target.log } });
			}

		} else {
			out.push('It seems '+args.attack+' does not have a device.factory yet.\nInvite him (or her!) to join with device.factory { invite:"'+args.attack+'" }');
		}

	}

    if (args && args.invite) {
		#s.chats.tell({ to:args.invite, msg:strings['ad_factory'][0] });
	}

	//return { ok:false, msg:out };
	out=out.concat(strings['bots_header']);
	let show_bot = false;
	let types = Object.keys(bots);
	for (let i=types.length-1; i>=0; i--) {
		//out.push('i='+i+' types[i]='+types[i]+' count='+owned[types[i]]); //continue;
		if (i < 2 || owned[types[i]] > 0 || owned[types[i-1]] > 0) { show_bot = true; }
		if (show_bot == false) continue;
		let count = owned[types[i]] || 0;
		let cost = m.int(bots[types[i]].cost);
		if (owned.nanites == '') owned.nanites = "0"; // Bughunt 2017-03-16
		let max_by_nanites = m._divide( owned.nanites , cost );
		let max_by_product = m._divide( owned[types[i-1]], cost );
		let max = i>0 ? (m._lt(max_by_nanites, max_by_product) ? max_by_nanites : max_by_product) : max_by_nanites;
		let c = owned[types[i]+'_c'] || 0; // Cloning level
		max = m.f_multiply(max, m._pow2(c));
		out.push(w(types[i], 12)+' '+w(hrn(count),22,true)+'  device.factory { '+types[i]+': "'+hrn(max)+'" }');
		//return { ok:false, msg:out };
	}
	out.push('');
	out.push('`PYou have` `F'+hrn(owned.nanites)+'` `Pnanite'+(owned.nanites==1?'':'s')+' and gain` `F'+hrn(mins_per_sec(owned))+'` `Pper '+tick(owned.warp)+'`\n');
	//return { ok:false, msg:out };
	out.push('`bTo double the nanite production for '+l.to_gc_str(l.math.ceil((owned.multiplier||1)/l.math.PI))+', use` device.factory { double:true }');
	out=out.concat(strings['bots_footer']);
//return { ok:false, msg:out };
	if (owned.bonus == true) {
		out=out.concat(strings['bonus_info']);
	}
	if (owned.cakebots && m._gt(owned.cakebots, "0")) {
		out=out.concat(strings['restart_info']);
	}
	if (can_warp(owned)) {
		out=out.concat(strings['warp_info']);
	}

	let t = l.get_date_utcsecs();
	if (caller == context.caller) {
		if (gamestate && gamestate._id) {
			#db.u({ script:'factory', player:caller }, { $set:{ owned:owned, t:t, log:log } });
		} else {
	    	#db.i({ script:'factory', player:caller, owned:owned, t:t, log:log });
		}
    }

	// Admin stuff
	if (caller == 'device' && args && args.about == 'players') {
		let unsorted = #db.f({ script:'factory' }).array();
		let res = unsorted.sort( function(a,b) {
			if (a.player < b.player) return -1;
			if (a.player > b.player) return 1;
			return 0;
		} );
		//out.push('res='+JSON.stringify(res));
		out.push('');
		for (let i in res) {
			let acct = res[i];
			if (acct.player == caller) continue;
			recalc(acct);
			let days = (t - acct.t) / 86400000; // 24 hours
			out.push(w(acct.player,24)+' '+w(hrn(acct.owned.multiplier),16, true)+' '+w(days.toFixed(0), 4, true)+' '+w(acct.owned.warp||1, 6, true));
			// Permanently delete players who purchased nothing and didn't play in 30 days
			if (days > 30 && acct.owned.multiplier == 1 && acct.owned.nanobots == 1) {
				#db.r({ script:'factory', player:acct.player });
			}
			//out.push('device.factory { attack:"'+acct.player+'", with:'+owned.nanobots+' }');
		}
	}


	if (caller == 'device' && args && args.grant) {
		let target = #db.f({ script:'factory', player:args.grant }).first();
		if (target && target.owned) {
			target.owned.bonus = true;
			#db.u({ script:'factory', player:args.grant }, { $set:{ owned:target.owned, t:t, log:target.log } });
			out.push('Granted a free bonus to player "'+args.grant+'"');
		} else {
			out.push('No player "'+args.grant+'" found');
		}
	}


	return out;

	function yesterday(last) {
		let old = new Date(last);
		let cur = new Date(l.get_date_utcsecs());
		if (old.toISOString().substr(0,10) != cur.toISOString().substr(0,10)) {
			return true;
		} else {
			return false;
		}
	}


	function recalc(acct, debug) {
		// Update game state
		let delta = m._int((l.get_date_utcsecs() - acct.t) * (acct.owned.warp || 1) / 1000);
		//out.push('delta='+delta);
		if (typeof acct.owned.nanites == 'string') {
			let n = acct.owned.nanites;
			// Workaround for unexplained failure 2017-03-13
			n = n.replace(/\D/g, "");
		}
		let n = m._int(acct.owned.nanites);
		let nps = m._int(mins_per_sec(acct.owned));
		n = m._add(n, m._multiply(delta, nps));
		if (args && args.nanites_want_to_be_free) n = args.nanites_want_to_be_free;
		acct.owned.nanites = n;//( acct.owned.nanites || 0 ) + l.math.floor( mins_per_sec(acct.owned) * delta );
		let types = Object.keys(bots);
		let score = "0";
		for (let i=types.length-1; i>=0; i--) {
			let e = acct.owned[types[i+1]+'_e'] || "0"; // Efficiency level
			let o = m._int(acct.owned[types[i]] || "0");
			let p = m._int(acct.owned[types[i+1]] || "0");
			let p2e = m._pow2(e); // Efficiency factor
			let f = m.f_multiply(delta, p2e); // Gain factor (delta seconds * efficiency factor)
			let g = m.f_multiply(f, p); // Units gained
			let no = m._add(o, g);
			acct.owned[types[i]] = no;
			// Calculate aggregated score
			score = m._add(score, m.f_multiply(no, m._int(bots[types[i]].cost))); //acct.owned[types[i]] * bots[types[i]].cost;
			//if (i==3) return;
		}
		acct.score = m._int(score);
	}

	function mins_per_sec(owned) {
		return owned.multiplier || 1;
	}

	function destroy(owned, type, amount) {
		amount = m._abs(amount);
		owned[type] = l.math.floor(owned[type] * 1) || 0;
		if (owned[type] < amount) amount = owned[type];
		owned[type] = l.math.floor(owned[type] * 1) - amount;
		return 'Destroyed '+amount+' '+type+'.\n';
	}

	function create(bots, owned, type, amount, resource1, resource2) {
		let c = owned[type+'_c'] || 0; // Cloning level
		let p2c = m._pow2(c);
		let cycles = m._divide(amount, p2c);//l.math.ceil(amount / p2c);
		let cost = m._int(bots[type].cost);
		if (context.caller != 'device') {
			if (resource1 != null) {
				if (m._cmp(owned[resource1], m._multiply(cycles, cost)) == -1) cycles = m._divide(owned[resource1], cost);
			}
			if (resource2 != null) {
				if (m._cmp(owned[resource2], m._multiply(cycles, cost)) == -1) cycles = m._divide(owned[resource2], cost);
			}
			let price = m._multiply(cycles, cost);
			if (resource1 != null) owned[resource1] = m._subtract(owned[resource1], price);
			if (resource2 != null) owned[resource2] = m._subtract(owned[resource2], price);
		}
		amount = m._multiply(cycles, p2c);
		owned[type] = m._add(owned[type], amount);//l.math.floor(owned[type] * 1) + amount;
		return 'Created '+hrc(amount, type)+'.\n';
	}

	function w(s,l,left) { // Format string to width
		let p = ' '.repeat(l);
		if (left) {
			return (p+s).substr(l*-1);
		} else {
			return (s+p).substr(0,l);
		}
	}

	function sub_unit(name) {
		let sub = null;
		for (let n in bots) {
			if (n === name) return sub;
			sub = n;
		}
		return null;
	}

	function sup_unit(name) {
		let next = false;
		for (let n in bots) {
			if (next == true) return n;
			if (n === name) next = true;
		}
		return null;
	}

	// Return human readable count i.e. "1 thing" or "3 things"
	function hrc(count, name) {
		return hrn(count) + ' ' + (count == "1" ? name.substr(0, name.length-1) : name);
	}

	// Return a human-readable string representation of a number in string, float or integer format
	// WARNING: Loss of precision!
	function hrn(n) {
		let dec = m._decode(n); // { sign:sign, int:n, point:point }
		//if (dec.point > 0) { return '['+dec.point+','+dec.int+'] '+n; } // Return fractions as-is for now
		if (dec.point > 0) { return n; } // Return fractions as-is for now
		if (dec.int.length <= 12) {
		 	// Up to and including billions, simply add thousands separators
			n = dec.int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			return (dec.sign=='+' ? n : '-'+n );
		} else {
			// Switch to scientific notation
			n = dec.int.substr(0,1) + '.' + dec.int.substr(1,11) + 'e+' + (dec.int.length - (dec.point+1));
			return (dec.sign=='+' ? n : '-'+n );
		}
		//return JSON.stringify(dec);
	}

	// Return the highest tier of robots owned, or 'nanobots'
	function top_owned(owned) {
		let types = Object.keys(bots);
		for (let i=types.length-1; i>=0; i--) {
			if ((owned[types[i]] || "0") == "0") continue;
			return types[i];
		}
		return 'nanobots';
	}

	function tick(f) {
		let s = "second";
		if (f == null || f <= 1) return s;
		return "1/"+f+" "+s;
	}

	function can_warp(owned) {
		let n = owned.nanobots.length;
		if (n > 20 && n > (owned.warp || 1)) return true;
		return false;
	}

	function safe_caller() {
		if (context.calling_script && context.calling_script.split('.')[0] != context.caller) return false;
		return true;
	}
}
