class MainMenu extends Menu
{
    constructor(trekgame)
    {
        super();

        this.options = [];

        this.options.push
        (
            new MenuOption
            (
                "0",
                ") ",
                "DOCK WITH STARBASE",
                function()
                {
                    let adjacentStarbases = trekgame.currentSector.getAdjacentEntitiesOfType(trekgame.enterprise, StarBase).filter(function(starbase){return starbase.isOperational();});
                    console.assert(adjacentStarbases.length);

                    let sb = adjacentStarbases[0];

                    trekgame.enterprise.dockWithStarbase(sb);

                    trekgame.showDockMenu(sb);

                    trekgame.advanceStardate(1.0);

                    return false;
                }
            ),
            new MenuOption
            (
                "0",
                ") ",
                "BOMBARD PLANET ("+TrekGame.BombardCost+" TORPEDOES)",
                function()
                {

                    let bombardPrompt = "\nWhile in orbit around the planet, your scanners detected a base established by enemies of the empire.";
                    bombardPrompt += "\nYou could bombard the base to lure enemy ships into the sector.  Make sure you're prepared, because a large ";
                    bombardPrompt += "number of ships may deploy to the sector!";

                    gameOutputAppend(bombardPrompt);

                    let confirmMenu = new Menu();

                    confirmMenu.options.push
                    (
                        new MenuOption
                        (
                            "1", ") ", "BOMBARD THE PLANET (" + TrekGame.BombardCost + " TORPEDOES)", function(){trekgame.bombardPlanet(); return true;}
                        ),
                        new MenuOption
                        (
                            "2", ") ", "NEVER MIND", function(){return true;}
                        )
                    );

                    trekgame.awaitInput
                    (
                        confirmMenu.toString(),
                        1,
                        function(inputline){return confirmMenu.chooseOption(inputline);}
                    );

                    return false;
                }
            ),
            new MenuOption
            (
                "1",
                ") ",
                "NAVIGATION",
                function()
                {
                    let navigationMenu = new Menu();
                    navigationMenu.options.push
                    (
                        new MenuOption
                        (
                            "1",
                            ") ",
                            "SHORT RANGE JUMP (1 STARDATE)",
                            function()
                            {
                                if (trekgame.typingFree)
                                {
                                    trekgame.gridHandler = function(x,y){trekgame.shortRangeNavigationHandler(trekgame, x, y);}
                                    trekgame.showBackMenu("SELECT DESTINATION ON THE MAP");
                                    return false;
                                }
                                else
                                {
                                    trekgame.getSubsectorMenu(trekgame.shortRangeNavigationHandler);
                                }
                                return false;
                            }
                        ),
                        new MenuOption
                        (
                            "2",
                            ") ",
                            "JUMP TO ANOTHER SECTOR  (1 STARDATE)",
                            function()
                            {
                                if (trekgame.typingFree)
                                {
                                    trekgame.mapScreenGalaxy = true;
                                    trekgame.gridHandler = function(x,y)
                                    {
                                        trekgame.longRangeJump(x,y);
                                    }

                                    trekgame.showBackMenu("SELECT DESTINATION SECTOR ON THE GALAXY MAP");
                                    return false;
                                }
                                else
                                {
                                    trekgame.awaitInput("Enter destination sector X coordinate. Enter a value between 1 and " + mapWidthSectors, 2, trekgame.navigationHandlerLongRangeX);
                                }
                                return false;
                            }
                        ),
                        new MenuOption
                        (
                            "3", ") ", "BACK", function(){return true;}
                        )
                    );

                    trekgame.awaitInput(navigationMenu.toString(), 1, function(inputline){return navigationMenu.chooseOption(inputline);});

                    //trekgame.awaitInput("Enter heading (degrees).", 3, trekgame.navigationHandler);
                }
            ), 

            new MenuOption
            (
                "2", ") ", "WEAPONS",
                function()
                {
                    MainMenu.showWeaponsMenu(trekgame);
                }
            ),

            new MenuOption
            (
                "3",
                ") ",
                "SHIELD CONTROL",
                function()
                {
                    let totalEnergy = (trekgame.enterprise.freeEnergy + trekgame.enterprise.shields);
                    
                    let suggestedStr = "";
                    if (trekgame.currentSector.countHostileEntities())
                    {
                        let klingonList = trekgame.currentSector.getHostileEntities();

                        let suggestedShieldLevel = trekgame.enterprise.suggestedMinShieldLevel(klingonList);

                        if (!trekgame.enterprise.components.ShieldControl.estimateAvailable())
                        {
                            suggestedShieldLevel = "?????";
                        }

                        suggestedStr += "\nSUGGESTED SHIELD LEVEL FOR CURRENT COMBAT SITUATION: " + suggestedShieldLevel;
                    }

                    let maxStr = "\nMAXIMUM SHIELD ENERGY: " + trekgame.enterprise.lanceShieldLimit();

                    let headerStr = "ENTER NEW SHIELD ENERGY LEVEL. \nAVAILABLE ENERGY: " + totalEnergy + maxStr + suggestedStr;

                    if (trekgame.typingFree)
                    {
                        let increment = trekgame.enterprise.components.ShieldControl.maxShields() / 5;
                        let shieldMenu = new Menu();
                        let maxShields = trekgame.enterprise.components.ShieldControl.maxShields();

                        shieldMenu.headerString = headerStr;

                        for (var x = 0; x < 6; x++)
                        {

                            let shieldAmount = x * increment;
                            let optionString = "SET SHIELD ENERGY TO " +shieldAmount + " ("+ (100*shieldAmount / maxShields) + '%)'; 

                            shieldMenu.options.push
                            (
                                new MenuOption
                                (
                                    x+1,
                                    ") ",
                                    optionString,
                                    function(){trekgame.shieldHandler("" + shieldAmount);return true;}
                                )
                            );
                        }

                        shieldMenu.options.push(new MenuOption("7", ") ", "TYPE IN MANUALLY", 
                            function()
                            {
                                trekgame.awaitInput(headerStr, 4, trekgame.shieldHandler, true);
                                return false;
                            }));
                        shieldMenu.options.push(new MenuOption("8", ") ", "BACK", function(){return true}));
                        trekgame.awaitInput(shieldMenu.toString(), 1, function(inputline){return shieldMenu.chooseOption(inputline);});
                    } 
                    else
                    {
                        trekgame.awaitInput(headerStr, 4, trekgame.shieldHandler);
                    }
                }
            ),

            new MenuOption
            (
                "4",
                ") ",
                "SENSORS",
                function()
                {
                    let enemyScanAddendum = trekgame.currentSectorScanned ? "" : " (" + Enterprise.EnemyScanCost + " ENERGY)";
                    let sensorMenu = new Menu();

                    sensorMenu.options.push
                    (
                        new MenuOption("1", ") ", "SCAN ENEMY SHIPS" + enemyScanAddendum, function(){trekgame.scanEnemyShips(); return true;}),
                        new MenuOption("2", ") ", "LONG RANGE SENSORS (1 STARDATE)", function(){trekgame.longRangeScan(); return true;}),
                        new MenuOption("3", ") ", "BACK", function(){return true;})
                    );

                    return trekgame.awaitInput(sensorMenu.toString(), 1, function(inputline){return sensorMenu.chooseOption(inputline);});
                }
            ),

            new MenuOption
            (
                "5",
                ") ",
                "SHIP'S COMPUTER",
                function()
                {
                    return trekgame.awaitInput(trekgame.computerMenu.toString(), 1, function(inputline){return trekgame.computerMenu.chooseOption(inputline);});
                }
            ),

            new MenuOption
            (
                "6",
                ") ",
                "ADVANCED SYSTEMS",
                function()
                {
                    trekgame.showAdvancedSystemsMenu();
                    return false;
                }
            )
        );

        this.dockOption = this.options[0];
        this.dockOption.enabled = false;

        this.bombardOption = this.options[1];
        this.bombardOption.enabled = false;
    }

    static showWeaponsMenu(trekgame)
    {
        var weaponsMenu = new Menu();

        weaponsMenu.options.push(
        new MenuOption
            (
                "1",
                ") ",
                "PHASERS",
                function()
                {
                    if (!trekgame.enterprise.components.PhaserControl.canFire())
                    {
                        gameOutputAppend("\nPhasers too damaged to fire!");
                        return true;
                    }
                    if (trekgame.currentSector.countHostileTargets())
                    {
                        let pm = new PhaserMenu(trekgame);
                        trekgame.showMenu(pm);
                        return false;
                    }
                    else
                    {
                        gameOutputAppend("\nPhaser control : No enemies detected in this sector, captain.");
                        return true;
                    }
                }
            ),

            new MenuOption
            (
                "2",
                ") ",
                "PHOTON TORPEDOES ("+Enterprise.TorpedoEnergyCost+" ENERGY)",
                function()
                {
                    if (trekgame.enterprise.torpedoes <= 0)
                    {
                        gameOutputAppend("\nWe're out of torpedoes, captain!");
                    }
                    else if (trekgame.enterprise.components.PhotonTubes.canFire())
                    {
                        if (trekgame.enterprise.components.PhotonTubes.targetingAvailable())
                        {
                            // automatic targeting enabled. push a menu of targets.
                            console.log("auto targeting path");

                            let torpMenu = new TorpedoMenu(trekgame.currentSector.getHostileTargets(), trekgame);

                            trekgame.awaitInput(torpMenu.toString(), 1, function(inputline){return torpMenu.chooseOption(inputline);});
                        }
                        else
                        {
                            gameOutputAppend("\nDue to damage, torpedo targeting computer is nonfunctional.");
                            gameOutputAppend("You will have to enter the torpedo destination coordinates manually!");
                            trekgame.manualTorpedoHandler();
                        }
                    }
                    else
                    {
                        gameOutputAppend("Torpedo tubes too damaged to fire!");
                    }
                }
            ),

            new MenuOption
            (
                "3",
                ") ",
                "PHOTON TORPEDO OVERLOAD (" + (Enterprise.TorpedoEnergyCost + Enterprise.TorpedoOverloadEnergyCost) + " ENERGY)",
                function()
                {
                    if (trekgame.enterprise.torpedoes <= 0)
                    {
                        gameOutputAppend("\nWe're out of torpedoes, captain!");
                    }
                    else if (trekgame.enterprise.components.PhotonTubes.canFire())
                    {
                        gameOutputAppend("\nLoading photon torpedo overload. One torpedo and extra energy will be expended.");
                        if (trekgame.enterprise.components.PhotonTubes.targetingAvailable())
                        {
                            let torpMenu = new TorpedoMenu(trekgame.currentSector.getHostileTargets(), trekgame, true);
                            trekgame.awaitInput(torpMenu.toString(), 1, function(inputline){return torpMenu.chooseOption(inputline);});
                        }
                        else
                        {
                            gameOutputAppend("\nDue to damage, torpedo targeting computer is nonfunctional.");
                            gameOutputAppend("You will have to enter the overloaded torpedo destination coordinates manually!");
                            trekgame.manualTorpedoHandler(true);
                        }
                    }
                    else
                    {
                        gameOutputAppend("Torpedo tubes too damaged to fire!");
                    }
                }
            ),

            new MenuOption("4", ") ", "BACK", function(){return true;})

        );

        return trekgame.awaitInput(weaponsMenu.toString(), 1, function(inputline){return weaponsMenu.chooseOption(inputline);});
    }

}



class ChronitonLanceTargetMenu extends Menu
{
    constructor(targetList, trekgame)
    {
        super();
        this.headerString = "CHRONITON LANCE ARMED. SELECT VISIBLE HOSTILE TARGET:\n";

        for (var x = 0; x < targetList.length; x++)
        {
            let target = targetList[x];
            if (!trekgame.enterprise.canSeeEntity(target))
            {
                continue;
            }

            this.options.push
            (
                new MenuOption
                (
                    this.options.length + 1,
                    ") ",
                    target.constructor.displayName.toUpperCase() + " AT SUBSECTOR (" + target.subsectorString() + ")",
                    function()
                    {
                        trekgame.fireChronitonLance(target);
                        return true;
                    }
                )
            );
        }

        this.options.push(new MenuOption(this.options.length + 1, ") ", "BACK", function(){return true;}));
    }
}
