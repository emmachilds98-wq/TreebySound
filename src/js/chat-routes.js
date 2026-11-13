  var FLOWS = [
    {id:'box', title:'One speaker silent', words:['silent','no sound','dead','nothing from','speaker not working','box not working','top not working','one box','one speaker','one top','quiet','no output','not coming out'],
     ask:'Can you take a look, or shall I swap in a spare and quarantine the faulty part?',
     nodes:{
      start:{q:'Let\'s find which half of the system it\'s in. On the amp driving that box, does its channel show <strong>green</strong> (signal present) — on the front panel or in R1?', k:'Amp channel shows signal', opts:[['Yes, green','out'],['No green','in'],['Not a d&b amp / can\'t see it','generic']]},
      out:{q:'Signal is reaching the amp, so the fault is between the amp output and the box. Is that channel <strong>muted</strong> (red, or MUTE lit) on the amp or in R1?', k:'Channel muted', opts:[['Yes, muted','muted'],['Not muted','lock']]},
      muted:{q:'Find out <strong>who muted it and why</strong> before you unmute — it may be deliberate (a box out of service, a quiet area). If nobody knows, ask the system tech, then unmute with the level down.', k:'Result', end:true, links:[['#s6-17','6.17 Front panel']]},
      lock:{q:LOCK + ' Was one loose?', k:'speakON locked both ends', opts:[['Yes — now locked','retest'],['Both were locked','mode']]},
      retest:{q:'Unmute and play something at low level. Working now?', k:'Works after re-locking', opts:[['Yes','fixedlock'],['No','mode']]},
      fixedlock:{q:'A connector a quarter-turn short of locked is the classic. Worth a quick tug-test on every other speakON in the system while you\'re at it.', k:'Result', end:true, fixed:true},
      mode:{q:'Check the <strong>output mode</strong> for that channel pair (amp screen or R1). Which is it?', k:'Output mode', opts:[['Dual Channel','dual'],['Mix TOP/SUB','mix'],['2-Way Active','mix'],['Don\'t know','modeunknown']]},
      dual:{q:'In Dual Channel each box goes into its <strong>own individual output</strong> (A, B, C or D). Is the cable in the individual output for that channel?', k:'In individual output', opts:[['Yes','swap'],['No — it\'s in a centre one','wrongsock']]},
      mix:{q:'In paired modes the cable goes into the <strong>centre A/B or C/D</strong> output; pins 1 carry the top (or LF), pins 2 the sub (or HF). Is it a <strong>4-core</strong> cable in the centre output?', k:'4-core in centre output', opts:[['Yes','swap'],['It\'s 2-core / not sure','core'],['It\'s in an individual output','wrongsock']]},
      modeunknown:{q:'Find the plan or ask the system tech which mode that pair is in — and don\'t change the mode yourself. The label above the amp outputs says which socket and pins each mode uses.', k:'Result', end:true, links:[['#s6-17','6.17 Output modes']]},
      wrongsock:{q:'Mute, move the cable to the socket the mode actually feeds, lock it, and retest at low level. The table in 6.17 shows which is which.', k:'Result', end:true, links:[['#s6-17','6.17 Output modes']]},
      core:{q:'Swap for a cable you <em>know</em> is 4-core. A 2-core cable — or an NL2 plug or a 2-pole adapter anywhere in the run — only carries pins 1, so whatever listens on pins 2 gets nothing.', k:'Result', end:true, links:[['#s3-12','3.12 NL4 &amp; NLT4 cables']]},
      swap:{q:'Swap the speaker cable for a known-good one. Does the box work now?', k:'Works with a different cable', opts:[['Yes','badcable'],['No','boxtest']]},
      badcable:{q:'The cable\'s the fault. Label it with what it did and take it out of service — don\'t coil it back into stock.', k:'Result', end:true, fixed:true, links:[['#s11-5','11.5 Quarantining kit']]},
      boxtest:{q:'Try the box on a known-good amp channel that\'s running the right setup for it (ask before re-patching on someone else\'s system). Does it work there?', k:'Box works on another channel', opts:[['Works there','ampch'],['Still silent','badbox']]},
      ampch:{q:'The fault follows the <strong>amp channel</strong>. Note any message on its screen, hand it to the system tech, and use a spare channel if they agree.', k:'Result', end:true, links:[['#s6-19','6.19 d&amp;b faults']]},
      badbox:{q:'The fault follows the <strong>box</strong>. Quarantine it — label and report — and don\'t open it.', k:'Result', end:true, links:[['#s11-5','11.5 Quarantining kit'],['#s6-19','6.19 d&amp;b faults']]},
      'in':{q:'No signal at the amp, so look upstream. Is the source playing and the console output unmuted, with its meters moving?', k:'Console sending', opts:[['Console isn\'t sending','console'],['Console is sending','routing']]},
      console:{q:'It\'s on the console side: mute, fader, output patch or matrix. Work through console faults.', k:'Result', end:true, links:[['#s12-12','12.12 Console faults']]},
      routing:{q:'Check the amp\'s <strong>input mode</strong> (analogue / digital / network) and that channel\'s <strong>input routing</strong>. Do they match what\'s actually plugged in?', k:'Input mode & routing match', opts:[['Found a mismatch','routfix'],['They match','sigcable']]},
      routfix:{q:'If it\'s not your system, don\'t change it — tell the system tech exactly what you found. If it is yours, correct it and retest at low level.', k:'Result', end:true, links:[['#s6-17','6.17 Inputs']]},
      sigcable:{q:'Swap the signal cable into the amp. For AES, check the amp shows digital lock at the right sample rate. For a network feed, check the stream or subscription.', k:'Result', end:true, links:[['#s12-14','12.14 Network faults']]},
      generic:{q:'Treat it as a general speaker fault: power to the box or amp, speakON locked at both ends, the output patch actually routed to it — then swap the cable to isolate.', k:'Result', end:true, links:[['#s12-13','12.13 Speaker &amp; amp faults']]}
     }},
    {id:'sub', title:'Sub silent, tops fine (or the reverse)', words:['no sub','no subs','no bass','no low end','no bottom','sub silent','subs silent','sub is silent','subs are silent','sub quiet','sub not','subs not','sub dead','sub missing','sub isn','subs aren','tops fine','tops are fine','top is fine','top silent','tops silent','top is silent','tops are silent','no tops','top not working','tops not working','sub works','subs work','sub fine','subs fine','sub is fine','subs are fine'],
     ask:'Do you want to check the amp settings, or shall I keep swapping cables to isolate it?',
     nodes:{
      start:{q:'Is a d&amp;b amp feeding the top and the sub down <strong>one cable</strong> (Mix TOP/SUB — from the centre A/B or C/D output)?', k:'Top and sub on one cable', opts:[['Yes, one cable','core'],['No, separate channels','sep'],['Not sure','unsure']]},
      core:{q:'Is that cable <strong>4-core all the way</strong> — no 2-core section, no NL2 plug, no adapter in the run?', k:'4-core all the way', opts:[['Found a 2-core / NL2','box:core'],['All 4-core','chb']]},
      chb:{q:'On the amp, is the silent half\'s channel (B or D for the sub, A or C for the top) running the right setup, and unmuted?', k:'Channel setup and mute correct', opts:[['Wrong setup or muted','setup'],['Looks right','link']]},
      setup:{q:'Don\'t change setups on someone else\'s system. Report it: "Channel B on amp 2 shows [setup / mute], the plan says sub." Let the system tech correct it.', k:'Result', end:true, links:[['#s6-17','6.17 Output modes']]},
      link:{q:'Check the link cable between the sub and the top — locked at both ends, 4-core — then swap cables one at a time to isolate.', k:'Result', end:true, links:[['#s6-19','6.19 d&amp;b faults']]},
      sep:{q:'Then it\'s a single silent box. Does its amp channel show green (signal present)?', k:'Amp channel shows signal', opts:[['Yes','box:out'],['No','box:in']]},
      unsure:{q:'Look at the amp: the screen shows the output mode, and the label above the outputs says which socket feeds what. Then come back and pick again.', k:'Result', end:true, links:[['#s6-17','6.17 Output modes']]}
     }},
    {id:'crackle', title:'Crackle or cutting out', words:['crackle','crackling','crackly','crackle from','crackle on','crackling from','crackling on','intermittent','cutting out','cuts out','cutting','drops out','dropping out','comes and goes','scratchy','popping','pops','on and off'],
     ask:'Can you have a listen, or shall I carry on isolating it?',
     nodes:{
      start:{q:'Does it get worse when someone moves or touches the cable?', k:'Worse when cable moves', opts:[['Yes','lock'],['No','loud']]},
      lock:{q:LOCK + ' Was one loose?', k:'Connector was loose', opts:[['Yes — now locked','box:retest'],['No','swap']]},
      swap:{q:'Swap that cable for a known-good one. Gone?', k:'Gone after cable swap', opts:[['Yes','box:badcable'],['No','follow']]},
      follow:{q:'Move the box to another amp channel (or another box onto this channel). The fault follows the box, the channel, or neither?', k:'Fault follows', opts:[['The box','box:badbox'],['The channel','box:ampch'],['Neither — it\'s everywhere','source']]},
      loud:{q:'Does it only happen when it\'s loud?', k:'Only when loud', opts:[['Yes','loudres'],['No, any level','source']]},
      loudres:{q:'That sounds like overdrive or a damaged driver, not a cable. Turn down at the console: if it clears, it was being pushed too hard (look for yellow GR or red on the amp). If it\'s still there at low level, the driver may be damaged — quarantine the box.', k:'Result', end:true, links:[['#s6-17','6.17 Front panel']]},
      source:{q:'If it\'s on every box, it\'s upstream: a crackly input, the console, or a digital clock problem. If it\'s one box only, intermittent faults hide — keep a note of when it happens.', k:'Result', end:true, links:[['#s12-5','12.5 Intermittent faults'],['#s12-14','12.14 Digital clocking']]}
     }},
    {id:'limit', title:'Amp lights: yellow, red, distortion', words:['limit','limiting','limiter','gr','yellow','red','overload','ovl','distortion','distorted','harsh','clipping','clip','protect','protection','error','warning','temperature','overheat','hot'],
     ask:'Do you want me to bring the level down, or leave it with you?',
     nodes:{
      start:{q:'What does the amp show?', k:'Amp shows', opts:[['Yellow GR','gr'],['Red','red'],['An error message','err'],['Nothing — it just sounds distorted','box:start']]},
      gr:{q:'Yellow <strong>GR</strong> is gain reduction: the channel\'s limiter is working, because the box is at its limit. It isn\'t a fault. Turn down at the console. If it\'s lighting at a modest level, check that channel\'s setup actually matches the box.', k:'Result', end:true, links:[['#s6-17','6.17 Front panel']]},
      red:{q:'Read the screen: does it say the channel is <strong>muted</strong>, or <strong>overloaded</strong>?', k:'Red means', opts:[['Muted','box:muted'],['Overload','ovl']]},
      ovl:{q:'The signal feeding the amp is too hot. Bring the level down at the console output (or the amp input, if that\'s how the system is set up) until the red clears.', k:'Result', end:true, links:[['#s2-3','2.3 Gain structure']]},
      err:{q:'Write the exact text down. Over-temperature: check nothing is blocking the rack\'s ventilation front and back (doors, cases, sun) and reduce level. Anything else: tell the system owner. Don\'t keep power-cycling it.', k:'Result', end:true, links:[['#s6-19','6.19 d&amp;b faults']]}
     }},
    {id:'r1', title:'Amp not showing in R1', words:['r1','remote','network','ethernet','offline','not showing','cant see','can\'t see','laptop','ip address','oca','control','not online','remote id'],
     ask:'Can you help me get the control network up?',
     nodes:{
      start:{q:'First: R1 is control only — the amps still pass audio without it. Is the laptop actually on the amp control network: cable in, link light on, the right network adapter chosen in R1?', k:'Laptop on control network', opts:[['No / not sure','nic'],['Yes','some']]},
      nic:{q:'Plug in, choose the right adapter, and turn Wi-Fi off if the laptop is sending traffic the wrong way. Check the switch has power and link lights.', k:'Result', end:true},
      some:{q:'Can R1 see <strong>no</strong> amps, or just one or two missing?', k:'R1 sees', opts:[['None','none'],['Just some missing','missing']]},
      none:{q:'Usually the laptop\'s address or firewall. Check its IP is in the same range as the amps, allow R1 through the firewall, and confirm the amps are Ethernet ones — D6 and D12 need a CAN interface.', k:'Result', end:true, links:[['#s6-16','6.16 R1 &amp; software']]},
      missing:{q:'Check that amp\'s network cable and switch port, then look for a <strong>duplicate Remote ID or IP address</strong> — two amps with the same one fight, and one disappears.', k:'Result', end:true, links:[['#s6-19','6.19 d&amp;b faults']]}
     }},
    {id:'all', title:'Whole system silent', words:['whole system','everything','all speakers','whole pa','entire','nothing at all','no pa','all silent','total'],
     ask:'Where do you want me to look next?',
     nodes:{
      start:{q:'Is the console showing signal on its main outputs?', k:'Console outputs show signal', opts:[['No','box:console'],['Yes','amps']]},
      amps:{q:'Do the amps show green signal present?', k:'Amps show signal', opts:[['No','feed'],['Yes','mutes']]},
      feed:{q:'The break is between the console and the amps: output patch, stage box or network, AES/Dante routing, a processor in between. Trace the signal path one hop at a time.', k:'Result', end:true, links:[['#s2-1','2.1 Signal flow'],['#s12-14','12.14 Network faults']]},
      mutes:{q:'Amps have signal but nothing comes out: look for mutes in R1 (all amps or a group), amps in standby, or every channel muted at the front panel.', k:'Result', end:true, links:[['#s6-17','6.17 Front panel']]}
     }},
    {id:'nl4', kind:'setup', title:'Check or test an NL4 / NLT4 cable', words:['nl4','nlt4','nl8','nl2','speakon','speak on','cable test','tester','test a speaker cable','test speaker cable','test the speaker cable','speaker cable test','testing speaker cable','check a speaker cable','pinout','pin out','2-core','4-core','two core','four core','stx','coupler'],
     ask:'Is this cable OK to go out, or shall I quarantine it?',
     nodes:{
      start:{q:'Mute anything it\'s plugged into first. Then: (1) look — strain relief tight, no copper showing, latch springs back, body not cracked; (2) put it through a speakON cable tester — all four poles continuous, no shorts between any of them; (3) check the label says whether it\'s 2-core or 4-core. Pins 1± carry the first channel, pins 2± the second.', k:'Result', end:true, links:[['#s3-12','3.12 NL4 &amp; NLT4 cables'],['#s6-17','6.17 Which pins carry what']]}
     }},
    {id:'setup', kind:'setup', title:'Set up a d&b system', words:['d&b','d20','d80','d40','d90','d6','d12','amp rack','amps','amp','speakers','speaker','pa','line array','preset','arraycalc','output mode','loadmatch','system check','r1','speakon','nl4','nlt4','sub','subs','tops','hang','line array','array','flown','rack','system'],
     entries:{r1:['r1','remote','laptop'], cabling:['cable','cables','cabling','nl4','nlt4','speakon','sub cables'], lm:['loadmatch','system check'], modes:['output mode','mode','socket','which output'], prove:['prove','proving','test the boxes','check the boxes'], channel:['channel','preset','setup on','configure the amp'], lights:['light','lights','led','indicator'], seq:['whole','from scratch','start to finish','everything']},
     ask:'Can you check my setup before we go live?',
     nodes:{
      start:{q:'Which part of the d&amp;b setup are you on?', k:'Setup stage', opts:[['The whole sequence','seq'],['Which socket / output mode','modes'],['Running the speaker cables','cabling'],['Setting up a channel','channel'],['Connecting R1','r1'],['LoadMatch & System check','lm'],['Proving it box by box','prove'],['What the lights mean','lights']]},
      seq:{q:'Plan → prep and test cables → amps near the boxes → run and lock speaker cables → signal → power up with channels muted → configure (mode, setup, functions, level, delay) → R1 → System check → prove box by box at low level → whole system → save and write it down. The full twelve steps:', k:'Result', end:true, links:[['#s6-18','6.18 Setting up a d&amp;b system']]},
      modes:{q:'<strong>Dual Channel</strong>: individual outputs A–D, one channel per box, any cable. <strong>Mix TOP/SUB</strong>: centre A/B or C/D, top on pins 1, sub on pins 2 — 4-core cable. <strong>2-Way Active</strong>: centre output, LF on pins 1, HF on pins 2 — 4-core. <strong>NL8</strong>: all four channels on one multicore. Read the label above the outputs on older amps.', k:'Result', end:true, links:[['#s6-17','6.17 Output modes']]},
      cabling:{q:'<ol><li>Use 4-core NL4/NLT4 wherever the plan uses Mix TOP/SUB or 2-Way Active.</li><li>Into the socket the mode feeds — individual outputs for Dual Channel, centre for paired modes.</li><li>Push in and twist until it clicks, both ends; tug-test.</li><li>Label both ends with amp and channel.</li><li>Note the length and cable size if LoadMatch is used.</li></ol>', k:'Result', end:true, links:[['#s3-12','3.12 NL4 &amp; NLT4 cables'],['#s6-18','6.18 Step 4']]},
      channel:{q:'Per channel, from the plan: <strong>setup</strong> for the exact box → functions (CUT when tops run with subs, HFA, CPL… only as the plan says) → level → delay → EQ → input routing. Check each against the box it\'s actually driving. On someone else\'s system, the system tech does this; you check and report.', k:'Result', end:true, links:[['#s6-17','6.17 Channel settings']]},
      r1:{q:'<ol><li>Laptop on the control network (cable, right adapter, Wi-Fi off if it gets in the way).</li><li>Laptop address in the same range as the amps.</li><li>Every amp has a unique Remote ID / address.</li><li>Open the project, match devices, go online — and if R1 asks which way to synchronise, don\'t send the project to the amps unless you\'re sure (it overwrites them).</li><li>Every amp should show, with no warnings.</li></ol>', k:'Result', end:true, links:[['#s6-16','6.16 R1 &amp; software'],['#s6-19','6.19 If an amp is missing']]},
      lm:{q:'<strong>LoadMatch</strong> corrects for the speaker cable — enter the real length and cross-section for that channel. <strong>System check</strong> compares each box against a known-good reference; take the reference at prep, run the check after building, and look into anything it flags (cable first, then the box).', k:'Result', end:true, links:[['#s6-16','6.16 LoadMatch &amp; System check']]},
      prove:{q:'<ol><li>Everything muted except one channel.</li><li>Low-level pink noise (the amp\'s generator) or a known track.</li><li>Walk to the box: right box answering, every driver working, nothing rattling.</li><li>Next channel. Subs and tops on the right channels.</li><li>Then polarity, with the system tech\'s method.</li></ol>', k:'Result', end:true, links:[['#s6-18','6.18 Step 10']]},
      lights:{q:'Green: signal present. Yellow GR: limiter working — the box is at its limit. Red: overload, or the channel is muted — the screen says which.', k:'Result', end:true, links:[['#s6-17','6.17 Front panel']]}
     }},
    {id:'setupother', kind:'setup', title:'Set something else up', words:['line check','linecheck','ring out','ringing out','wedge','wedges','multitrack','recording','record','iem','iems','in-ear','in ear','wireless','radio mic','radio mics','radios','broadcast','stream','streaming','show file','showfile'],
     entries:{lc:['line check','linecheck'], rf:['wireless','radio','radios'], ring:['ring out','ringing','wedge'], iem:['iem','in-ear','in ear'], mt:['multitrack','recording','record'], bc:['broadcast','stream'], sf:['show file','showfile']},
     ask:'Can you check it before we go live?',
     nodes:{
      start:{q:'What are you setting up?', k:'Setting up', opts:[['A line check','lc'],['Radio mics','rf'],['Ringing out a wedge','ring'],['An IEM mix','iem'],['A multitrack recording','mt'],['A broadcast / stream feed','bc'],['A console show file','sf']]},
      lc:{q:'Patch order, one input at a time: speak or play it, see it on the right channel, hear it, label it, tick it. Anything odd gets fixed or flagged before the next.', k:'Result', end:true, links:[['#s11-3','11.3 Running a line check'],['#s19-5','19.5 Line check sheet']]},
      rf:{q:'Scan → coordinate → set frequencies → antennas and distribution → fresh batteries → walk test the whole space → prove each pack. Then don\'t change anything without re-checking.', k:'Result', end:true, links:[['#s5-8','5.8 Setting up wireless']]},
      ring:{q:'Level up slowly with the mic where the performer will be, find the first ring, notch it narrowly, carry on — two or three cuts, not twenty.', k:'Result', end:true, links:[['#s15-8','15.8 Ringing out a wedge']]},
      iem:{q:'Start with the performer\'s own source, then what they need to play in time and in tune, then the rest. Low and safe first; ask, don\'t guess.', k:'Result', end:true, links:[['#s15-7','15.7 Building an IEM mix']]},
      mt:{q:'Storage space and format agreed, track names, a test recording played back <em>before</em> doors, and someone owning the record button.', k:'Result', end:true, links:[['#s14-7','14.7 Multitrack recording']]},
      bc:{q:'A separate, isolated mix built for the feed, tested with the receiving end, with its own level checks — never just a copy of the room mix.', k:'Result', end:true, links:[['#s14-8','14.8 Broadcast submix']]},
      sf:{q:'Save early and often, name it with date and venue, keep a backup off the console, and never overwrite someone else\'s file.', k:'Result', end:true, links:[['#s7-4','7.4 Show file discipline']]}
     }},
    {id:'array', title:'Line array: one box or part of the hang wrong',
     entries:{dull:['dull','no top end','no highs','muffled','sounds different'], zones:['top of the hang','bottom of the hang','top half','bottom half'], coverage:['coverage','front to back','back of the room','too loud at the front'], 'box:start':['silent','not working']},
     words:['line array','array','hang','flown','the hang','top box','top boxes','bottom box','bottom boxes','arrayprocessing','array processing','throw','one box in','part of the array','down the array'],
     ask:'Can you check the array setups and processing with me?',
     nodes:{
      start:{q:'What\'s wrong with the hang?', k:'Array symptom', opts:[['One box silent','box:start'],['One box sounds dull or different','dull'],['The top or bottom of the hang sounds wrong','zones'],['Level or coverage front-to-back is off','coverage']]},
      dull:{q:'Solo that box at low level and listen close. Then check, in order: its <strong>setup variant</strong> matches the plan (Arc, Line or AP — a box on the wrong variant sounds different), the speaker cable carries all the pins it needs, and the HF driver is actually working. A box that sounds dull on the right setup and a good cable has a driver fault — quarantine it.', k:'Result', end:true, links:[['#s6-20','6.20 Setup variants'],['#s6-19','6.19 d&amp;b faults']]},
      zones:{q:'With <strong>ArrayProcessing</strong>, each box gets filters calculated for its own place in the hang. If amps or channels were swapped, or a cable re-patched, those filters land on the wrong box. Check the patch against the plan box by box, that every box is on its AP setup, and that the system tech has loaded the processing onto every amp. Don\'t edit it yourself.', k:'Result', end:true, links:[['#s6-16','6.16 ArrayProcessing'],['#s6-18','6.18 Setting up']]},
      coverage:{q:'Usually design or aim, not a fault: splay angles, trim height, ArrayProcessing on or off, LoadMatch cable data. Note where it\'s too loud or too quiet and tell the system tech — changing angles or trim is a rigging job.', k:'Result', end:true, links:[['#s6-6','6.6 Coverage'],['#s6-8','6.8 Tuning']]}
     }},
    {id:'cardioid', title:'Cardioid subs: too much bass behind them',
     entries:{csa:['csa','reversed','backwards','facing back','turned round'], endfire:['end-fire','endfire','end fire'], builtin:['v-sub','v-gsub','j-sub','sl-sub','ksl-sub','xsl-sub','ccl-sub']},
     words:['cardioid','behind the subs','back of the subs','rear of the subs','stage bass','bass on stage','csa','end-fire','endfire','end fire','sub array','rear rejection','bass behind'],
     ask:'Can you check the sub array settings with me?',
     nodes:{
      start:{q:'How are the subs arranged?', k:'Sub arrangement', opts:[['d&b cardioid subs (V-SUB, J-SUB, SL…)','builtin'],['A stack with one box facing backwards','csa'],['End-fire: subs in a line, front to back','endfire']]},
      builtin:{q:'Built-in cardioid subs only cancel behind when every driver is working on the right cardioid setup. Check: the setup is the cardioid one from the plan, every driver is producing (listen close at low level, front and back), and nothing is right up against the back — a wall or set close behind stops the cancellation working.', k:'Result', end:true, links:[['#s6-6','6.6 Sub configurations'],['#s6-20','6.20 Models']]},
      csa:{q:'The reversed box needs its own amp channel running the cardioid processing (its delay and polarity), and the spacing must match the plan. Check that channel\'s setup, the box positions, and that nobody has "fixed" a polarity or delay setting. Wrong delay or polarity gives you <em>more</em> bass on stage and less out front.', k:'Result', end:true, links:[['#s6-6','6.6 Sub configurations']]},
      endfire:{q:'Each row is delayed to match its distance from the front, so spacing and delays have to agree with the plan. A row out of position, or delays reset on one amp, and the rear cancellation disappears. Check positions with a tape and delays in R1 against the plan.', k:'Result', end:true, links:[['#s6-6','6.6 Sub configurations'],['#calcDelay','Delay calculator']]}
     }},
    {id:'phasey', title:'Sounds thin, phasey or hollow',
     entries:{overlap:['overlap','fill','fills','front fill','delay','delays','out fill'], seats:['some seats','one area','one side','power alley'], everywhere:['everywhere','whole room','all over']},
     words:['phasey','phasy','phase','out of phase','thin','hollow','comb','combing','comb filter','flanging','swirly','cancelling','cancellation','no low mid','time alignment','alignment','echo','slap','doubled','smeared'],
     ask:'Can we check polarity and alignment together?',
     nodes:{
      start:{q:'Where do you hear it?', k:'Where it sounds wrong', opts:[['Everywhere','everywhere'],['Only where two systems overlap (mains and a fill or delay)','overlap'],['Only in some seats','seats']]},
      everywhere:{q:'Check, in order: one box or channel with reversed polarity (a cable wired wrong, or a polarity setting), <strong>CUT</strong> left on the tops with no subs running (thin), and sub-to-top alignment. Mute the subs — if the tops on their own sound right, it\'s how the subs and tops join, which is the system tech\'s call.', k:'Result', end:true, links:[['#s6-8','6.8 Tuning'],['#s6-17','6.17 CUT']]},
      overlap:{q:'Two systems arriving at different times comb-filter where they overlap. The fill or delay system\'s delay has to match its distance from the mains — check the delay in R1 against the plan, and against the delay calculator for a sanity check. Temperature shifts it slightly over long distances.', k:'Result', end:true, links:[['#calcDelay','Delay calculator'],['#s6-8','6.8 Time alignment']]},
      seats:{q:'Usually the room or the layout, not a fault: reflections off a nearby wall, or the "power alley" between left and right subs. Walk it, note where it happens, and tell the system tech.', k:'Result', end:true, links:[['#s6-15','6.15 The room'],['#s6-6','6.6 Subs']]}
     }},
    {id:'digital', title:'Amp input: AES, Milan or Dante not arriving',
     entries:{fallback:['fallback','backup input','override'], milan:['milan','avb'], dante:['dante','ds10','ds20'], aes:['aes','aes3','lock','sample rate']},
     words:['aes','aes3','digital input','sample rate','lock','unlocked','no lock','milan','avb','ds10','ds20','stream','fallback','override','network audio','96k','48k','digital link','backup input'],
     ask:'Can you check the digital feed with me?',
     nodes:{
      start:{q:'How is signal getting to the amps?', k:'Input type', opts:[['AES (digital XLR)','aes'],['Milan (D25, D40, D90)','milan'],['Dante, through a DS10 or DS20','dante'],['It switched to its backup input','fallback']]},
      aes:{q:'<ol><li>Does the amp show digital lock? No lock means no audio.</li><li>Sample rate matches what the amp accepts (48 or 96 kHz on D20/D80).</li><li>Proper 110 Ω AES cable on long runs, not mic cable.</li><li>The digital link chain is unbroken — each amp feeds the next from its link out.</li><li>The amp\'s input mode is set to digital and the channels are routed from D1–D4.</li></ol>', k:'Result', end:true, links:[['#s6-17','6.17 Inputs'],['#s12-14','12.14 Digital faults']]},
      milan:{q:'Milan isn\'t Dante: it needs AVB-capable switches, and the stream has to be connected to the amp in the network controller. On a D40 or D90, the main Milan and R1 port is <strong>ETH1/PRI</strong> — ETH2/SEC is for redundancy only. Dante Controller won\'t show Milan devices at all.', k:'Result', end:true, links:[['#s8-2','8.2 Networks'],['#s6-20','6.20 Amps']]},
      dante:{q:'The DS10 turns Dante into AES for the amps, so check it in two halves: the DS10\'s Dante subscriptions and clock in Dante Controller, then its AES outputs and the cables onward to the amps (and their lock lights).', k:'Result', end:true, links:[['#s12-14','12.14 Network faults']]},
      fallback:{q:'Current d&amp;b amps can switch to a <strong>fallback</strong> input when the main one is lost — manually or automatically. If an amp is running on fallback, the main input failed: find out why before switching back, and remember the fallback feed may be a different mix or level.', k:'Result', end:true, links:[['#s6-17','6.17 Inputs']]}
     }},
    {id:'loading', title:'How many boxes per amp channel', words:['per channel','boxes per channel','speakers per channel','how many boxes','how many speakers','how many cabs','impedance','ohm','ohms','load','too many','parallel','daisy chain','daisy-chain','link out','link through'],
     ask:'Can you confirm how many boxes this channel should run?',
     nodes:{
      start:{q:'Every d&amp;b box has a maximum number per amp channel, which can differ between amps — it\'s in the box\'s manual, and ArrayCalc won\'t let a plan exceed it. Linking more boxes through on one channel lowers the load: too many and the channel limits hard (yellow GR) or protects. Stick to what the plan says; if the plan isn\'t to hand, ask rather than guess.', k:'Result', end:true, links:[['#s2-7','2.7 Impedance'],['#s6-20','6.20 Models'],['#s6-19','6.19 d&amp;b faults']]}
     }},
    {id:'noise', title:'Hiss or noise from the speakers', words:['hiss','hissing','white noise','static','noisy','whine','whining','noise from the speakers','noise floor','background noise','digital noise','high pitched'],
     ask:'Can you help me find where the noise is coming in?',
     nodes:{
      start:{q:'Mute the amp channel\'s input (or the console output feeding it). Does the noise stop?', k:'Stops when input muted', opts:[['Yes','upstream'],['No','amp']]},
      upstream:{q:'It\'s coming in with the signal. Work back towards the console: an open channel with too much gain, a noisy source or DI, a long unbalanced run, or a digital clock problem (clicks and whines). Gain structure is usually the answer to steady hiss.', k:'Result', end:true, links:[['#s2-5','2.5 Gain staging'],['#s12-14','12.14 Clocking']]},
      amp:{q:'Noise with the input muted is in the amp, the speaker cable or the box. Swap the speaker cable, then move the box to another channel. If it stays with one amp channel, report the amp with any screen message — don\'t open it.', k:'Result', end:true, links:[['#s6-19','6.19 d&amp;b faults']]}
     }},
    {id:'hum', title:'Hum or buzz', words:['hum','humming','buzz','buzzing','ground loop','earth','mains hum','hum from','buzz from','hum on','buzz on','hum when','laptop hum','hum laptop'],
     ask:'Can I try a ground lift on the DI, or do you want to look?',
     nodes:{
      start:{q:'Mute channels one at a time. Does the hum go away when one particular source is muted?', k:'Hum follows one source', opts:[['Yes, one source','one'],['No — it\'s on the PA itself','pa']]},
      one:{q:'Most likely a ground loop or an unbalanced source — a laptop on its charger, a DI, an instrument. Try the DI\'s ground lift, or run the laptop on battery.', k:'Result', end:true, links:[['#s12-3','12.3 Ground loops'],['#s12-10','12.10 DI faults']]},
      pa:{q:'With every input muted, hum on the PA is in the system itself: amp and processor feeds, mains to the racks, or a damaged signal cable. Don\'t lift mains earths — ever. Report it to the system owner.', k:'Result', end:true, links:[['#s12-3','12.3 Ground loops'],['#s12-15','12.15 Power faults']]}
     }},
    {id:'mic', title:'Mic or input has no signal', words:['mic','microphone','input','channel','no signal','phantom','di box','stage box','vocal','no meter','mic not working','microphone not working','mic dead','mic silent','no sound from mic','nothing from mic','channel not working','input not working'],
     ask:'Do you want me to swap the mic, or leave it and flag it?',
     nodes:{
      start:{q:'Work it from the source towards the desk: mic switched on, phantom on if it\'s a condenser, cable swapped for a known-good one, then a different stage-box input. The fault follows whatever you\'ve just swapped.', k:'Result', end:true, links:[['#s12-9','12.9 Mic &amp; cable faults'],['#s12-10','12.10 DI faults']]}
     }},
    {id:'desk', title:'Desk shows signal, nothing coming out', words:['desk','console','mixer','dm7','meter','meters','no output','nothing out','main','master','bus','mix','output patch','solo','pfl','headphones only','scene'],
     entries:{solo:['headphones only','only in headphones','solo','pfl'], scene:['scene','recalled','changed']},
     ask:'Can you check the desk with me, or tell me how it should be patched?',
     nodes:{
      start:{q:'Look at the meters. Is the <strong>channel</strong> meter moving, and does the <strong>main (stereo) meter</strong> move too?', k:'Desk meters', opts:[['Channel yes, main no','route'],['Both move, nothing in the room','outpatch'],['I only hear it in headphones','solo'],['It all changed suddenly','scene']]},
      route:{q:'The channel isn\'t reaching the main mix. Check: channel <strong>on</strong> (not muted), fader up, the channel <strong>assigned to the stereo/main bus</strong>, its <strong>DCA</strong> up, and no <strong>mute group</strong> active. Found it?', k:'Channel to main', opts:[['Yes','fixedroute'],['All fine','outpatch']]},
      fixedroute:{q:'Good. If a mute group or DCA caught you out, tell the engineer — it may be set that way for a reason (a scene for walk-in, say).', k:'Result', end:true, fixed:true, links:[['#s7-7','7.7 Console gotchas']]},
      outpatch:{q:'The desk is mixing, so it\'s after the main bus. Check the <strong>output patch</strong> (main to the right local or Dante outputs), the <strong>output isn\'t muted</strong>, and then the far end: Dante route green (§8.9), amp input present, amps unmuted. Where does the signal stop?', k:'Output path', opts:[['At the desk output patch','fixpatch'],['On the network / Dante','dante:start'],['At the amps','box:start'],['Can\'t tell','splitter']]},
      fixpatch:{q:'Patch the main (and sub/fill feeds) to the outputs the system expects — the patch list or the system tech will say which — and retest at low level.', k:'Result', end:true, links:[['#s7-9','7.9 DM7 show setup']]},
      splitter:{q:'Send tone or pink noise from the desk\'s oscillator to the PA output at low level, then follow it: desk output meter, the Dante subscription, the amp\'s input indicator. The first place it disappears is the fault.', k:'Result', end:true, links:[['#s12-12','12.12 Console faults'],['#s12-1','12.1 The method']]},
      solo:{q:'Something is soloed (PFL/AFL) — that only changes what you hear in the headphones. Find the <strong>clear solo</strong> key and press it, then listen again.', k:'Result', end:true, links:[['#s7-6','7.6 Talkback, tone and solo']]},
      scene:{q:'A scene probably recalled. Don\'t recall another one to "fix" it — tell the engineer. Then check that scene\'s <strong>Recall Safe / Focus</strong> settings so it can\'t happen again.', k:'Result', end:true, links:[['#s7-8','7.8 Yamaha DM7'],['#s7-4','7.4 Show file discipline']]}
     }},
    {id:'iem', title:'In-ear monitors: no sound, noise or dropouts', words:['iem','iems','in ear','in-ears','in ears','ears','earpiece','monitor pack','bodypack','iem pack'],
     ask:'Can the monitor engineer take a look at the IEM transmitter?',
     nodes:{
      start:{q:'What\'s the performer hearing?', k:'IEM symptom', opts:[['Nothing at all','none'],['Hiss, noise or dropouts','noise'],['Mix is wrong or too quiet','mix']]},
      none:{q:'<ol><li>Pack switched on, volume up, earpieces plugged in fully.</li><li>Pack on the same frequency/channel as its transmitter (resync it).</li><li>Transmitter on, RF on (not muted), and getting audio from the desk — check its input meter.</li><li>Fresh batteries.</li></ol>Sound now?', k:'Basic checks', opts:[['Yes','fixediem'],['Still nothing','mix']]},
      noise:{q:'Usually RF. Check the transmitter antenna (and its cable), line of sight to the stage, and whether a new device is near that frequency — rescan and move to a clean coordinated frequency. Batteries too.', k:'Result', end:true, links:[['#s5-7','5.7 IEMs'],['#s12-11','12.11 Wireless faults']]},
      mix:{q:'Check the mix itself on the desk: the right channels sent to that IEM mix, sends pre-fade, mix master up, the mix patched to the right transmitter input. Then ask the performer what they want more of — one change at a time.', k:'Result', end:true, links:[['#s15-3','15.3 Building IEM mixes'],['#s15-6','15.6 Monitor world faults']]},
      fixediem:{q:'Good. Label the pack and its transmitter with the performer\'s name so the pair stays together.', k:'Result', end:true, fixed:true}
     }},
    {id:'dm7', kind:'setup', title:'Set up a Yamaha DM7', words:['dm7','dm 7','dm7 compact','yamaha','yamaha desk','rio','scene','recall safe','focus recall','dante desk','show file'],
     entries:{dante:['dante','rio','network','stage box','stagebox'], scenes:['scene','recall safe','focus','show file'], rec:['record','recording','multitrack','dvs']},
     nodes:{
      start:{q:'Which part of the DM7 setup are you on?', k:'DM7 stage', opts:[['The whole sequence','seq'],['Dante and Rio stage boxes','dante'],['Scenes and protecting settings','scenes'],['Recording','rec']]},
      seq:{q:'<ol><li>Power and Dante cables (secondary only to a separate network).</li><li>Save the current show file to USB first.</li><li>Load the job\'s show file, or initialise.</li><li>Check Dante: every device seen, sample rate matches, right clock leader.</li><li>Patch inputs, name and colour channels.</li><li>Patch outputs: PA, subs, fills, monitors, recording.</li><li>Mixes: monitors pre-fade, effects post-fade.</li><li>Recall Safe what must never change.</li><li>Line check, send tone to every output.</li><li>Store a scene and save to USB again.</li></ol>', k:'Result', end:true, links:[['#s7-9','7.9 DM7 show setup'],['#s7-8','7.8 Yamaha DM7']]},
      dante:{q:'In the DM7\'s Dante setup: every Rio or Dante device listed and synced, 48 or 96 kHz everywhere, one clock leader as designed. Rio gains and phantom are set from the desk (HA) — only touch them if the preamps are yours. Then patch Rio inputs to channels.', k:'Result', end:true, links:[['#s7-8','7.8 Yamaha DM7'],['#s8-9','8.9 Dante Controller']]},
      scenes:{q:'Store a scene once the line check is clean. Put <strong>Recall Safe</strong> on anything no scene should change (talkback, PA feeds, broadcast feed), and use <strong>Focus Recall</strong> so each scene only changes what it should. Save the show file to USB with the date in its name.', k:'Result', end:true, links:[['#s7-8','7.8 Yamaha DM7'],['#s7-4','7.4 Show file discipline']]},
      rec:{q:'USB gives 18 channels in and out — fine for a stereo or small recording. For a full multitrack, record over Dante with Dante Virtual Soundcard (up to 64 channels at 48 kHz), and record pre-fader. Check drive space first.', k:'Result', end:true, links:[['#s7-9','7.9 DM7 show setup'],['#s14-7','14.7 Multitrack recording']]}
     }},
    {id:'presenter', kind:'setup', title:'Check presenter mics before a corporate event', words:['presenter','presenters','speaker mic','lectern','lavalier','lav','headset mic','conference','corporate','panel','speech','speeches','awards','lapel mic','lav placement','lavalier placement','mic placement presenter'],
     nodes:{
      start:{q:'Which are you checking?', k:'Presenter setup', opts:[['The whole check','seq'],['Lectern mic','lectern'],['Radio lavalier or headset','lav'],['A panel of speakers','panel']]},
      seq:{q:'<ol><li>Running order: who, when, which mic.</li><li>One labelled channel per person; spares synced and on.</li><li>Ring out every mic at its real position with the room PA.</li><li>Playback and video levels matched to speech.</li><li>Hybrid: mix-minus to the call, tested both ways.</li><li>Before each speaker: fresh battery, muted until they walk on.</li></ol>', k:'Result', end:true, links:[['#s10-11','10.11 Corporate audio, step by step'],['#s19-18','19.18 Corporate AV checklist']]},
      lectern:{q:'Gooseneck aimed at the mouth from 20–40 cm, high-pass on, rung out with the PA at show level. Ask the presenter to stay at the lectern, or give them a radio mic too.', k:'Result', end:true, links:[['#s4-4','4.4 The stock'],['#s15-8','15.8 Ringing out']]},
      lav:{q:'Lavalier on the sternum (about a hand\'s width below the chin), on the side they turn to; cable taped so it can\'t rustle. Headset for movers and quiet talkers. Fresh battery, gain set so they don\'t clip, pack labelled, muted until they\'re on.', k:'Result', end:true, links:[['#s10-11','10.11 Corporate audio, step by step'],['#s5-11','5.11 Shure and Sennheiser systems']]},
      panel:{q:'One mic per panellist, all into the desk\'s automixer if it has one (the Dugan on a DM7) so open mics don\'t add up to feedback and room noise. Ring them out with all of them open.', k:'Result', end:true, links:[['#s10-11','10.11 Corporate audio, step by step'],['#s7-8','7.8 Yamaha DM7']]}
     }},
    {id:'side', title:'One side of the PA missing (left or right)', words:['one side','left side','right side','stage left','stage right','left missing','right missing','only left','only right','left hang','right hang','one hang','half the pa','one side of the pa'],
     ask:'Can you check the output patch and the feed to that side?',
     nodes:{
      start:{q:'Look at the desk\'s main <strong>L and R</strong> output meters. Are both moving?', k:'Desk L/R meters', opts:[['Both move','after'],['Only one moves','pan'],['Not sure / can\'t see','tone']]},
      pan:{q:'The desk is only sending one side. Check: everything isn\'t <strong>panned</strong> hard to one side, the main isn\'t set to mono-to-one-side, and no <strong>matrix or output</strong> for that side is muted. Fixed?', k:'Pan and main', opts:[['Yes','fixedside'],['No','after']]},
      after:{q:'The desk sends both, so it\'s after the desk. Follow the missing side: <strong>output patch</strong> → Dante/AES/analogue route to that side\'s amps → amp input indicators (green?) → amp channels muted? Where does it stop?', k:'Missing-side path', opts:[['Desk output patch','fixpatchside'],['Network / signal to the amps','dante:start'],['Amps show signal, boxes silent','box:start'],['Whole hang dead, amps off','power:start']]},
      tone:{q:'Send pink noise from the oscillator to the left output only, then the right, at low level. Listen and watch each side\'s amp inputs. The side that doesn\'t respond is the one to follow.', k:'Result', end:true, links:[['#s7-6','7.6 Talkback, tone and solo'],['#s12-12','12.12 Console faults']]},
      fixpatchside:{q:'Patch that side\'s output to the right socket or Dante channel (the system drawing says which), and retest with tone at low level.', k:'Result', end:true, links:[['#s8-8','8.8 System drawings']]},
      fixedside:{q:'Good. If the pan or mono setting came from a scene, tell the engineer so it doesn\'t come back.', k:'Result', end:true, fixed:true}
     }},
    {id:'clip', title:'Input distorted or clipping', words:['clipping','clip','is clipping','mic clipping','vocal clipping','input clipping','channel clipping','distorted vocal','distorting mic','input distorted','overload light','peak light','red on the channel','too hot','input red','gain too high','fuzzy vocal'],
     ask:'Can you check the gain structure with me?',
     nodes:{
      start:{q:'Is the <strong>channel\'s input meter</strong> hitting the top or showing a peak/OL light?', k:'Input meter', opts:[['Yes, peaking','gain'],['No, meter looks fine','later']]},
      gain:{q:'Turn the <strong>gain/HA down</strong> until the loudest moments peak well below the top, then bring the fader up to compensate. If it\'s a DI on a hot source, use its pad. If the gain is already all the way down, the source is too hot — pad it or ask for it turned down. On a shared stage box, ask the preamp owner first.', k:'Result', end:true, links:[['#s2-5','2.5 Gain structure'],['#s3-9','3.9 DI boxes']]},
      later:{q:'The input\'s clean, so the distortion is later: a compressor or insert overdriven, a bus or the main clipping, the amps limiting, or a damaged speaker. Solo the channel in headphones — clean there? Then it\'s downstream.', k:'Where it distorts', opts:[['Clean in headphones','limit:start'],['Distorted in headphones too','dirty']]},
      dirty:{q:'Distorted at the desk with a clean input meter means processing on the channel: bypass inserts, then the compressor and EQ one at a time. Also try a different mic and cable — a failing mic or cable can sound distorted at any level.', k:'Result', end:true, links:[['#s12-9','12.9 Mic &amp; cable faults'],['#s16-10','16.10 Processing order']]}
     }},
    {id:'wedge', title:'Performer can\'t hear themselves', words:['cant hear themselves','can\'t hear myself','can\'t hear themselves','more me','wedge too quiet','monitor too quiet','cant hear in wedge','monitor mix','wedge','more vocal in','turn me up'],
     ask:'Can the monitor engineer take this one?',
     nodes:{
      start:{q:'Is it a <strong>wedge</strong> or <strong>IEMs</strong>?', k:'Monitor type', opts:[['Wedge','level'],['IEMs','iem:start']]},
      level:{q:'Is the wedge making <strong>any</strong> sound?', k:'Wedge sound', opts:[['Nothing at all','box:start'],['Yes, just not enough of them','more']]},
      more:{q:'<ol><li>Their channel is in that mix (send up, pre-fade).</li><li>The wedge is pointed at their ears from where they actually stand.</li><li>Turn <strong>down</strong> what\'s masking them before turning them up.</li><li>Raise slowly, listening for the edge of feedback — then stop.</li></ol>Feeding back before it\'s loud enough? Ring it out and move the mic or wedge.', k:'Result', end:true, links:[['#s15-11','15.11 Building a wedge mix'],['#s15-8','15.8 Ringing out']]}
     }},
    {id:'comms', title:'Comms (intercom) not working', words:['comms','intercom','clearcom','clear-com','clear com','riedel','green-go','greengo','beltpack','belt pack','headset','talkback channel','cans'],
     ask:'Can you check the comms base station or tell me who looks after comms?',
     nodes:{
      start:{q:'Is it <strong>one belt pack</strong>, or <strong>everyone</strong>?', k:'Comms scope', opts:[['One pack','pack'],['Everyone / one whole channel','base']]},
      pack:{q:'<ol><li>Headset plugged in fully; try a known-good headset.</li><li>Pack on the right channel, volume up, mic switched on (talk button/latch).</li><li>Wired: swap the XLR from the ring — a damaged cable kills a pack. Wireless: battery, and is the pack registered to the base?</li></ol>', k:'Result', end:true, links:[['#s8-5','8.5 Comms'],['#s11-8','11.8 Comms check']]},
      base:{q:'Look at the base station or master: powered, the channel on, and (wired party-line) the line not shorted — unplug outstations one at a time to find a bad cable. Network comms: the network link is up. Comms usually belongs to production or the stage manager — tell them straight away.', k:'Result', end:true, links:[['#s8-5','8.5 Comms']]}
     }},
    {id:'playback', title:'Playback or laptop audio problems', words:['playback','laptop','qlab','music not playing','video sound','spotify','walk on music','backing track','playback machine','computer audio','usb audio','hdmi audio'],
     ask:'Can I swap to the backup playback?',
     nodes:{
      start:{q:'What\'s happening?', k:'Playback symptom', opts:[['No sound from it','none'],['Hum or buzz with it','hum:start'],['Clicks, drop-outs or stutter','glitch']]},
      none:{q:'<ol><li>Laptop output going to the right device (USB interface, not the built-in speakers or HDMI).</li><li>Laptop volume up and not muted; the player\'s own volume up.</li><li>Cable into a DI or interface, into the right desk channel — channel meter moving?</li><li>Bluetooth off, so audio isn\'t going to a speaker somewhere else.</li></ol>', k:'Result', end:true, links:[['#s8-4','8.4 Playback']]},
      glitch:{q:'Plug the laptop into mains, turn off Wi-Fi, notifications, sleep and updates, close other apps, and check the audio interface\'s sample rate matches the desk. Have the backup ready to go if it happens during the show.', k:'Result', end:true, links:[['#s8-4','8.4 Playback']]}
     }},
    {id:'loop', title:'Hearing loop not working', words:['hearing loop','hearing loop not','loop not working','loop isn','loop silent','induction loop','loop system','t setting','loop amp','assistive listening','hearing aid','loop listener'],
     ask:'Can the venue check the loop driver, or do we need the installer?',
     nodes:{
      start:{q:'With a <strong>loop listener</strong> (or a hearing aid on T), do you hear <strong>anything</strong> in the loop area?', k:'Loop listener', opts:[['Nothing','driver'],['Hum or buzz','buzz'],['Speech too quiet or uneven','level']]},
      driver:{q:'Loop amplifier (driver) powered and on; its input lights show signal — is the desk feed patched to it? Loop cable connected at the driver. Most venues have a fixed install: the venue\'s technician or installer owns the driver settings.', k:'Result', end:true, links:[['#s6-11','6.11 Hearing loops'],['#s19-15','19.15 Access services checklist']]},
      buzz:{q:'Loops pick up magnetic fields — dimmers, LED drivers and power cables near the loop make buzz. Note when it happens (lighting changes?) and tell the venue; don\'t move the loop cable.', k:'Result', end:true, links:[['#s6-11','6.11 Hearing loops']]},
      level:{q:'Feed the loop the <strong>speech mics</strong> (not the music or the full mix), with compression, at a steady level. Uneven coverage is an install issue — report the spots.', k:'Result', end:true, links:[['#s6-11','6.11 Hearing loops']]}
     }},
    {id:'record', title:'Recording or stream has no (or wrong) audio', words:['recording','record','multitrack','stream','streaming','broadcast feed','press feed','zoom audio','teams audio','livestream','virtual soundcheck','dvs','no audio on recording','stream audio'],
     ask:'Can you check what the recording or stream is actually receiving?',
     nodes:{
      start:{q:'Recording or stream?', k:'Capture type', opts:[['Multitrack recording','rec'],['Stream / broadcast / video call','stream']]},
      rec:{q:'<ol><li>The computer sees the desk (USB or Dante Virtual Soundcard) and the DAW uses it as the input device.</li><li>Sample rate matches the desk.</li><li>Tracks armed and inputs routed; recording patch on the desk is set.</li><li>Record pre-fader if the mix moves shouldn\'t affect it.</li><li>Drive has space; record a test and play it back.</li></ol>', k:'Result', end:true, links:[['#s14-7','14.7 Multitrack recording'],['#s7-9','7.9 DM7 show setup']]},
      stream:{q:'<ol><li>The stream feed is its own mix (more vocals, room mics) patched to the output the stream kit uses.</li><li>Level: the stream kit\'s meters, not just yours.</li><li>Echo on a call? Build a mix-minus — the call shouldn\'t hear itself back.</li><li>Ask the stream or video team what they receive — agree it before doors.</li></ol>', k:'Result', end:true, links:[['#s14-8','14.8 Broadcast submix'],['#s10-8','10.8 Hybrid meetings']]}
     }},
    {id:'feedback', title:'Feedback', words:['feedback','howl','howling','squeal','ringing','screech'],
     ask:'Can you take over the ring-out?',
     nodes:{
      start:{q:'Pull the level down <strong>now</strong> — the open mic, or the master. Protect ears first, then work out which mic and which speaker are feeding each other.', k:'Result', end:true, links:[['#s12-18','12.18 Feedback'],['#s15-8','15.8 Ringing out']]}
     }},
    {id:'rf', title:'Radio mic dropouts', words:['radio','radio mic','radio mics','wireless mic','radio mic drop','radio mic cut','mic dropping out','mic cutting out','wireless','rf','dropout','dropouts','drop out','transmitter','receiver','beltpack','iem'],
     ask:'Can we look at the RF together before doors?',
     nodes:{
      start:{q:'Check the transmitter battery first, then the receiver\'s RF meters while someone walks the space. Antennas connected, line of sight, nothing new nearby transmitting. Then frequencies.', k:'Result', end:true, links:[['#s12-11','12.11 Wireless &amp; RF faults']]}
     }},
    {id:'dante', title:'Dante or network audio problems', words:['dante','dante drop','dante click','network drop','network click','dante dropout','dante dropouts','aes67','milan','avb','clock','clocking','subscription','glitch','glitching','clicks','dropouts on network'],
     ask:'Can you check the network with me?',
     nodes:{
      start:{q:'One clock leader, subscriptions all green, switches you trust, and nothing else sharing the network. Remember d&amp;b D40/D90 use Milan, which Dante Controller won\'t show.', k:'Result', end:true, links:[['#s12-14','12.14 Network faults'],['#s8-2','8.2 Networks']]}
     }},
    {id:'power', title:'Power: tripping or amp won\'t switch on', words:['power','trip','tripped','tripping','rcd','breaker','won\'t turn on','wont turn on','dead amp','mains','powercon','no power','distro'],
     ask:'Can you get the electrician to look at this feed?',
     nodes:{
      start:{q:'Anything electrical: <strong>don\'t open or reset distribution yourself</strong> unless that\'s explicitly your job. You can check the powerCON is locked, and try a known-good amp on the same feed. If a breaker or RCD has tripped, tell the person responsible — it tripped for a reason.', k:'Result', end:true, links:[['#s12-15','12.15 Power faults'],['#support-now','Make it safe']]}
     }}
  ];