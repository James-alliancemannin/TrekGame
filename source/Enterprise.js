class Enterprise extends GameObject
{
    canSeeEntity(entity)
    {
        return !this.components.ShortRangeSensors.isSubsectorCorrupt(entity.subsectorX, entity.subsectorY);
    }

    ensureAdvancedSystemsFields()
    {
        let defaults =
        {
            adaptiveShieldTurns : 0,
            adaptiveShieldCooldown : 0,
            chronitonLanceChargeTurns : 0,
            chronitonLanceArmed : false,
            chronitonLanceCooldown : 0,
            phaseCloakTurns : 0,
            phaseCloakCooldown : 0,
            temporalStrainTurns : 0
        };

        for (var key in defaults)
        {
            if (typeof this[key] != typeof defaults[key])
            {
                this[key] = defaults[key];
            }
        }
    }

    advancedDefenseActive()
    {
        this.ensureAdvancedSystemsFields();
        return this.adaptiveShieldTurns > 0 || this.phaseCloakTurns > 0;
    }

    lanceCharging()
    {
        this.ensureAdvancedSystemsFields();
        return this.chronitonLanceChargeTurns > 0;
    }

    lanceShieldLimit()
    {
        return this.lanceCharging() ? Enterprise.ChronitonLanceShieldCap : this.components.ShieldControl.maxShields();
    }

    phaserHitAvailable()
    {
        if (!this.components.PhaserControl.isHit())
        {
            return false;
        }

        this.ensureAdvancedSystemsFields();
        return this.temporalStrainTurns <= 0 || Math.random() >= Enterprise.TemporalStrainPhaserMissChance;
    }

    visiblePhaserTargets(game)
    {
        let targets = game.currentSector.getEntitiesOfTypes(Enterprise.PhaserTargets);
        let enterprise = this;
        return targets.filter(function(item){return enterprise.canSeeEntity(item)});
    }

    advanceTemporarySystemEffects()
    {
        for (var key in this.components)
        {
            this.components[key].advanceDisruption();
        }
    }

    advanceAdvancedSystemsCombatTurn()
    {
        this.ensureAdvancedSystemsFields();

        if (this.temporalStrainTurns > 0)
        {
            this.temporalStrainTurns--;
        }

        if (this.adaptiveShieldTurns > 0)
        {
            this.adaptiveShieldTurns--;
            if (this.adaptiveShieldTurns == 1)
            {
                gameOutputAppend("\nAdaptive matrix destabilising: 1 turn remaining.");
            }
            else if (this.adaptiveShieldTurns == 0)
            {
                this.adaptiveShieldCooldown = Enterprise.AdaptiveShieldCooldownTurns;
                gameOutputAppend("\nADAPTIVE SHIELD MATRIX COLLAPSED");
            }
        }
        else if (this.adaptiveShieldCooldown > 0)
        {
            this.adaptiveShieldCooldown--;
        }

        if (this.phaseCloakTurns > 0)
        {
            this.phaseCloakTurns--;
            if (this.phaseCloakTurns == 0)
            {
                this.phaseCloakCooldown = Enterprise.PhaseCloakCooldownTurns;
                this.temporalStrainTurns = Math.max(this.temporalStrainTurns, Enterprise.PhaseCloakStrainTurns);
                gameOutputAppend("\nEmergency phase cloak disengaged. Targeting sensors require recalibration.");
            }
        }
        else if (this.phaseCloakCooldown > 0)
        {
            this.phaseCloakCooldown--;
        }

        if (this.chronitonLanceChargeTurns > 0)
        {
            this.chronitonLanceChargeTurns--;
            if (this.chronitonLanceChargeTurns == 0)
            {
                this.chronitonLanceArmed = true;
                gameOutputAppend("\nCHRONITON LANCE ARMED.");
            }
            else
            {
                gameOutputAppend("\nCHRONITON LANCE CHARGE: " + this.chronitonLanceChargeTurns + " combat turns remaining. Defensive envelope remains reduced.");
            }
        }
        else if (this.chronitonLanceCooldown > 0)
        {
            this.chronitonLanceCooldown--;
        }

    }

    activateAdaptiveShieldMatrix()
    {
        this.ensureAdvancedSystemsFields();
        if (this.adaptiveShieldTurns > 0 || this.adaptiveShieldCooldown > 0)
        {
            gameOutputAppend("\nAdaptive shield matrix unavailable: active cycle or cooldown in progress.");
            return false;
        }
        if (this.phaseCloakTurns > 0 || this.lanceCharging())
        {
            gameOutputAppend("\nAdaptive shield geometry cannot stabilize alongside the current experimental system.");
            return false;
        }
        if (this.freeEnergy < Enterprise.AdaptiveShieldEnergyCost)
        {
            gameOutputAppend("\nInsufficient free energy for the adaptive shield matrix.");
            return false;
        }

        this.freeEnergy -= Enterprise.AdaptiveShieldEnergyCost;
        this.adaptiveShieldTurns = Enterprise.AdaptiveShieldDuration;
        gameOutputAppend("\nADAPTIVE SHIELD MATRIX ONLINE");
        return true;
    }

    beginChronitonLanceCharge()
    {
        this.ensureAdvancedSystemsFields();
        if (this.chronitonLanceArmed || this.lanceCharging() || this.chronitonLanceCooldown > 0)
        {
            gameOutputAppend("\nChroniton lance unavailable: charge cycle or cooldown already in progress.");
            return false;
        }
        if (this.advancedDefenseActive())
        {
            gameOutputAppend("\nTemporal coils cannot charge while an advanced defensive field is active.");
            return false;
        }
        if (this.freeEnergy < Enterprise.ChronitonLanceChargeCost)
        {
            gameOutputAppend("\nInsufficient free energy to charge the chroniton lance.");
            return false;
        }

        this.freeEnergy -= Enterprise.ChronitonLanceChargeCost;
        this.chronitonLanceChargeTurns = Enterprise.ChronitonLanceChargeDuration;
        if (this.shields > Enterprise.ChronitonLanceShieldCap)
        {
            this.freeEnergy += this.shields - Enterprise.ChronitonLanceShieldCap;
            this.shields = Enterprise.ChronitonLanceShieldCap;
        }
        gameOutputAppend("\nCHRONITON LANCE CHARGING: shields rerouted to temporal coils.");
        gameOutputAppend("Temporal coils are drawing shield power, but residual defences remain online.");
        gameOutputAppend("Warning: Chroniton Lance charge leaves defensive systems weakened.");
        return true;
    }

    cancelChronitonLanceCharge()
    {
        this.ensureAdvancedSystemsFields();
        if (!this.lanceCharging())
        {
            gameOutputAppend("\nNo chroniton lance charge is in progress.");
            return false;
        }

        this.chronitonLanceChargeTurns = 0;
        this.chronitonLanceCooldown = Enterprise.ChronitonLanceCancelCooldownTurns;
        gameOutputAppend("\nChroniton lance charge cancelled. Temporal coils enter a short recovery cycle.");
        return true;
    }

    activatePhaseCloak()
    {
        this.ensureAdvancedSystemsFields();
        if (this.phaseCloakTurns > 0 || this.phaseCloakCooldown > 0)
        {
            gameOutputAppend("\nEmergency phase cloak unavailable: active cycle or cooldown in progress.");
            return false;
        }
        if (this.adaptiveShieldTurns > 0 || this.lanceCharging())
        {
            gameOutputAppend("\nPhase cloak cannot engage alongside the current experimental field.");
            return false;
        }
        if (this.freeEnergy < Enterprise.PhaseCloakEnergyCost)
        {
            gameOutputAppend("\nInsufficient free energy for emergency phase cloak.");
            return false;
        }

        this.freeEnergy -= Enterprise.PhaseCloakEnergyCost;
        this.phaseCloakTurns = Enterprise.PhaseCloakDuration;
        gameOutputAppend("\nEMERGENCY PHASE CLOAK ENGAGED. Enterprise is slipping out of hostile weapons phase.");
        return true;
    }

    phaseCloakEvadesAttack()
    {
        this.ensureAdvancedSystemsFields();
        return this.phaseCloakTurns > 0 && Math.random() < Enterprise.PhaseCloakMissChance;
    }

    bombardPlanet(trekgame, planet)
    {
        console.assert(!planet.bombarded);

        if (this.torpedoes < TrekGame.BombardCost)
        {
            return false;
        }

        var klingonsMoved = 0;
        let klingonsToMove = Math.min(Math.min(trekgame.totalHostileInstances(), TrekGame.BombardReinforcementSize), trekgame.currentSector.emptySquares());

        for (var q in trekgame.galaxyMap.contents)
        {
            let sector = trekgame.galaxyMap.lookup1D(q);
            let sectorKlingons = sector.getHostileEntities();

            if (sector == trekgame.currentSector)
            {
                continue;
            }

            let shSector = this.sensorHistory.lookup1D(q);
            
            for (var i = 0; i < Math.min(klingonsToMove - klingonsMoved, sectorKlingons.length); i++)
            {
                let k = sectorKlingons[i];
                sector.removeEntity(k);
                trekgame.currentSector.addEntityInFreeSubsector(k);
                klingonsMoved++;

                // remove the enemy from the sensor history count -- 
                // i guess the enterprise could somehow scan where the enemy is warping in from?
                // from a gameplay standpoint i want only correct counts or question marks - not wrong info
                for (var enemyTypeIndex in TrekGame.EnemyTypes)
                {
                    let EnemyType = TrekGame.EnemyTypes[enemyTypeIndex];
                    if (k.constructor == EnemyType && EnemyType in shSector)
                    {
                        shSector[EnemyType]--;
                    }
                }
            }
        }

        console.log("Klingons moved : " + klingonsMoved);

        this.torpedoes -= TrekGame.BombardCost;

        planet.bombard();
    }

    componentDamageProbabilities()
    {
        var probArray = [];

        for (var key in this.components)
        {
            console.log("" + this.components[key].componentDamageProbability);
            probArray.push(this.components[key].componentDamageProbability);
        }

        console.assert(probArray.length == Object.keys(this.components).length);
        return probArray;
    }

    createComponents()
    {
        this.components =
        {
            WarpEngines : new WarpEnginesComponent(), 
            ShortRangeSensors: new ShortRangeSensorsComponent(),
            LongRangeSensors: new LongRangeSensorsComponent(),
            PhaserControl : new PhaserControlComponent(),
            PhotonTubes : new PhotonTubesComponent(),
            ShieldControl : new ShieldControlComponent(), 
            LibraryComputer : new LibraryComputerComponent()
        }
    }
    
    constructor()
    {
        super(Enterprise);
        this.torpedoes = Enterprise.StartTorpedoes;
        this.shields = Enterprise.StartShields;

        this.freeEnergy = Enterprise.StartEnergy;

        this.createComponents();

        this.hitNoShields = false;
        this.dockStarbase = null;
        this.sensorHistory = new SensorHistory();
        this.components.ShortRangeSensors.generateCorruptGrid();
        this.ensureAdvancedSystemsFields();
    }

    // called on navigation
    autoRepairComponents()
    {
        for (var key in this.components)
        {
            let oldHealth = this.components[key].componentHealth;
            this.components[key].componentHealth += (randomInt(Enterprise.MinComponentRepairPerTurn, Enterprise.MaxComponentRepairPerTurn) / 100);
            this.components[key].componentHealth = Math.min(this.components[key].componentHealth, 1.0);

            if (this.components[key].componentHealth == 1.0 && oldHealth != 1.0)
            {
                gameOutputAppend("\n" + this.components[key].componentName + " fully repaired!");
            }
        }
    }

    repairRandomComponent()
    {
        var damagedComponents = [];

        for (var key in this.components)
        {
            if (this.components[key].componentHealth != 1.0)
            {
                damagedComponents.push(this.components[key]);
            }
        }

        console.log("Enterprise has " + damagedComponents.length + " damaged components");

        if (!damagedComponents.length)
        {
            gameOutputAppend("\nStation repair crews report no damaged components require work.");
            return null;
        }

        let componentToRepair = damagedComponents[randomInt(0, damagedComponents.length-1)];
        componentToRepair.componentHealth = 1.0;

        gameOutputAppend("\nStation repair crews fully repaired " + componentToRepair.componentName + ".");
        return componentToRepair;
    }

    undock(starbase)
    {
        this.dockStarbase = null;
    }

    dockWithStarbase(starbase)
    {
        console.assert(starbase);
        console.log("dock with starbase");

        this.dockStarbase = starbase;

        gameOutputAppend("\nDocked with operational starbase. The starbase's shields protect the Enterprise while docked.");
        starbase.resupplyEnterprise(this);
        this.repairRandomComponent();
    }

    // is our total energy less than the minimum energy cost to get anywhere?
    isStranded()
    {
        return (this.freeEnergy + this.shields) < this.warpEnergyCost(1); // energy cost to travel one square.
    }

    isDestroyed()
    {
        return this.hitNoShields;
    }

    // suggested minimum shield level for the current battlefield, to survive at least one round of enemy fire
    suggestedMinShieldLevel(enemyList)
    {
        let possibleDamageSum = 0.0;

        for (var x in enemyList)
        {
            possibleDamageSum += enemyList[x].maxPhaserDamage();
        }

        return possibleDamageSum;
    }

    // is it possible for a single round of enemy fire to destroy the enterprise?
    isShieldLevelCritical(enemyList)
    {
        return !this.dockStarbase && (this.shields < this.suggestedMinShieldLevel(enemyList));
    }

    warpEnergyCost(numSubsectors)
    {
        return Enterprise.EnergyCostPerSubsector * numSubsectors;
    }
    
    // assumes that the input value has been previously checked for the appropriate range and available value
    setShieldLevel(newShields)
    {
        if ((newShields > this.freeEnergy + this.shields) || newShields < 0.0)
        {
            throw "Invalid value for shield level"; 
        }

        let adjustedShields = Math.min(this.lanceShieldLimit(), newShields);

        if (!(adjustedShields > 0))
        {
            gameOutputAppend("Sorry captain, we've taken too much damage to raise shields!");
        }
        if ((adjustedShields < newShields))
        {
            if (this.lanceCharging() && adjustedShields == Enterprise.ChronitonLanceShieldCap)
            {
                gameOutputAppend("\nChroniton charging suppresses shields above " + adjustedShields);
            }
            else if ( (adjustedShields < ShieldControlComponent.MaxShields))
            {
                gameOutputAppend("\nBecause of damage to the deflector shields, we cannot raise shields above " + adjustedShields);
            }
            else
            {
                gameOutputAppend("\nCannot exceed the maximum shield level of " + adjustedShields);
            }

            newShields = adjustedShields;
        }

        this.freeEnergy += this.shields - newShields;
        this.shields = newShields;

        gameOutputAppend("\nShields set to " + this.shields + ".  " + this.freeEnergy + " free energy remaining.");
    }

    toString()
    {
        return "<*>";
    }

    static maxInstancesGame()
    {
        return 1;
    }

    static maxInstancesSector()
    {
        return 1;
    }

    static minInstancesGame()
    {
        return 1;
    }

    conditionString(game)
    {
        if (game.currentSector.countHostileTargets())
        {
            return "RED";
        }

        if ((this.freeEnergy + this.shields) < .1 * Enterprise.StartEnergy)
        {
            return "YELLOW";
        }

        return "GREEN";
    }

    passthroughDamage(energy)
    {
        // we want to map (as a starting guess, pre balance) 500 energy to a total wipeout of a component
        let passthroughDamage = energy * randomFloat(.001, .002);

        // random component index
        let idx = randomWithProbabilities(this.componentDamageProbabilities());

        let component = this.components[Object.keys(this.components)[idx]];

        component.passthroughDamage(this, passthroughDamage);

        gameOutputAppend(component.componentName + " hit.  Now at " + Math.floor(component.componentHealth*100) + "% integrity" );
    }

    onPhaserHit(energy, game)
    {
        if (this.dockStarbase)
        {
            gameOutputAppend("The starbase shields protect you from the incoming phaser fire.");
            return;
        }

        this.ensureAdvancedSystemsFields();
        if (this.adaptiveShieldTurns > 0)
        {
            energy = Math.max(1, Math.floor(energy * Enterprise.AdaptiveShieldDamageMultiplier));
            gameOutputAppend("Incoming weapons refract across the adaptive shield geometry.");
        }

        let hitRatio = this.shields > 0 ? energy / this.shields : Infinity;

        if (this.shields < energy)
        {
            if (this.adaptiveShieldTurns > 0)
            {
                this.shields = 0.0;
                gameOutputAppend("Adaptive matrix absorbs the residual hull-breach energy.");
                return;
            }

            this.hitNoShields = true;
            this.shields = 0.0;
            return;
        }

        this.shields -= energy;
        gameOutputAppend("Shields at " + this.shields);

        if ((hitRatio > Enterprise.DamagePassthroughRatio) || Math.random() < Enterprise.RandomPassthroughRatio)
        {
            this.passthroughDamage(energy);
        }        
    }

    firePhasers(energy, game)
    {
        console.log("fire phasers");

        let targets = game.currentSector.getEntitiesOfTypes(Enterprise.PhaserTargets);

        let targetsFiltered = this.visiblePhaserTargets(game);

        console.assert(energy <= this.freeEnergy);

        if (!targetsFiltered.length)
        {
            gameOutputAppend("\nUnable to lock phasers onto targets because of sensor damage!");
            return false;
        }

        this.freeEnergy -= energy;

        let endstr = targetsFiltered.length > 1 ? "s." : ".";
        gameOutputAppend("\nFiring phasers at " + targetsFiltered.length + " target" + endstr);
        
        let invisibleEnemies = targets.length - targetsFiltered.length;
        if (invisibleEnemies > 1)
        {
            gameOutputAppend("" + invisibleEnemies + " enemies not able to be targeted due to sensor damage!");
        }
        else if (invisibleEnemies == 1)
        {
            gameOutputAppend("" + 1 + " enemy not able to be targeted due to sensor damage!");
        }
      
        let damagePerTarget = energy / targetsFiltered.length;

        var x;
        for (x in targetsFiltered)
        {
            console.log("target");
            let target = targetsFiltered[x];
            let dist = this.distanceToObject(target);

            let damageAttenuated = damagePerTarget / dist;
            let damageFinal = Math.floor(randomFloat(2.0, 3.0) * damageAttenuated);

            if (this.phaserHitAvailable())
            {
               target.onPhaserHit(damageFinal, game);
            }
            else
            {
                gameOutputAppend("Phasers miss!");
            }
        }

        if (!game.currentSectorScanned)
        {
            gameOutputAppend("\nRun combat sensor scan to see enemy shield levels.");
        }

        return true;
    }

    fireFocusedPhaser(energy, target, game)
    {
        console.log("fire focused phaser");

        console.assert(energy <= this.freeEnergy);

        if (Enterprise.PhaserTargets.indexOf(target.constructor) == -1 || game.currentSector.sectorEntities.indexOf(target) == -1)
        {
            gameOutputAppend("\nFocused phaser strike requires a hostile target in this sector.");
            return false;
        }

        if (!this.canSeeEntity(target))
        {
            gameOutputAppend("\nUnable to maintain a focused phaser lock because of sensor damage!");
            return false;
        }

        this.freeEnergy -= energy;

        gameOutputAppend("\nTACTICAL: Focused phaser strike locked on " + target.constructor.displayName + " at subsector " + target.subsectorString() + ". Emitters holding a narrow firing solution.");

        let dist = this.distanceToObject(target);
        let damageAttenuated = energy / dist;
        let damageFinal = Math.floor(randomFloat(2.7, 3.7) * damageAttenuated);

        if (this.phaserHitAvailable())
        {
            target.onPhaserHit(damageFinal, game);
        }
        else
        {
            gameOutputAppend("WARNING: Focused phaser strike misses; targeting scanners report beam scatter.");
        }

        if (!game.currentSectorScanned)
        {
            gameOutputAppend("\nRun combat sensor scan to see enemy shield levels.");
        }

        return true;
    }

    fireTorpedo(game, target, overloaded=false)
    {
        let energyCost = overloaded ? Enterprise.TorpedoEnergyCost + Enterprise.TorpedoOverloadEnergyCost : Enterprise.TorpedoEnergyCost;

        if (this.torpedoes <= 0)
        {
            gameOutputAppend("\nWe're out of torpedoes, captain!");
            return false;
        }

        if (this.freeEnergy >= energyCost)
        {
            gameOutputAppend("\n" + (overloaded ? "WARNING: Photon torpedo overload armed; shockwave safeties disengaged. Firing towards subsector " : "Firing torpedoes towards subsector ") + target.subsectorString());
            let torpedoIntersection = game.currentSector.intersectionTest(this.subsectorX, this.subsectorY, target.subsectorX, target.subsectorY, Infinity);
            this.torpedoes--;
            this.freeEnergy -= energyCost;
            
            if (this.components.PhotonTubes.isHit() && torpedoIntersection.intersects != null)
            {
               let hitObject = torpedoIntersection.intersects;
               hitObject.onTorpedoHit(game);

               if (overloaded && Enterprise.PhaserTargets.indexOf(hitObject.constructor) != -1)
               {
                   game.applyTorpedoOverloadSplash(hitObject, Enterprise.TorpedoOverloadSplashDamage);
               }
            }
            else
            {
                gameOutputAppend("\nThe torpedo missed!");
            }

            return true;
        }
        else
        {
            //not enough energy
            gameOutputAppend("\nNot enough energy to fire " + (overloaded ? "an overloaded torpedo" : "torpedoes") + "!");
        }

        return false;
    }

    lrsStringEntityTypes(galaxyMap, entityTypes)
    {
        let header = "   ";
        for (let x = this.sectorX - 1; x <= this.sectorX + 1; x++)
        {
            header += padStringToLength((""+(x+1)), 6);
        }

        let border = "-------------------";
        let rval = header + "\n   " + border + '\n';

        for (let y = this.sectorY - 1; y <= this.sectorY + 1; y++)
        {
            rval += " " + (y+1) + " |";
            for (let x = this.sectorX - 1; x <= this.sectorX + 1; x++)
            {
                let sector = galaxyMap.lookup(x, y);
                if (sector)
                {
                    let k = 0;
                    for (var entityTypeIndex in entityTypes)
                    {
                        k += sector.countEntitiesOfType(entityTypes[entityTypeIndex]);
                    }

                    if (x == this.sectorX && y == this.sectorY)
                    {
                        k = "" + k + "E";
                    }

                    rval += " " + padStringToLength(""+k, 3) + " |";
                }
                else
                {
                    rval += " *** |";
                }
            }
            rval += "\n   " + border + "\n";
        }
        return rval;
    }

    lrsStringEntityType(galaxyMap, entityType)
    {
        let header = "   ";
        for (let x = this.sectorX - 1; x <= this.sectorX + 1; x++)
        {
            header += padStringToLength((""+(x+1)), 6);
        }

        let border = "-------------------";
        let rval = header + "\n   " + border + '\n';

        for (let y = this.sectorY - 1; y <= this.sectorY + 1; y++)
        {
            rval += " " + (y+1) + " |";
            for (let x = this.sectorX - 1; x <= this.sectorX + 1; x++)
            {
                let sector = galaxyMap.lookup(x, y);
                if (sector)
                {
                    let k = sector.countEntitiesOfType(entityType);

                    if (x == this.sectorX && y == this.sectorY)
                    {
                        k = "" + k + "E";
                    }

                    rval += " " + padStringToLength(""+k, 3) + " |";
                }
                else
                {
                    rval += " *** |";
                }
            }
            rval += "\n   " + border + "\n";
        }
        return rval;
    }

    // long range scan
    lrsString(trekGame, galaxyMap)
    {
       
        let klingonLRS = this.lrsStringEntityTypes(galaxyMap, TrekGame.HostileTargetTypes);
        let starLRS = this.lrsStringEntityType(galaxyMap, Star);
        //let starbaseLRS = this.lrsStringEntityType(galaxyMap, StarBase);

        let rval = "\t HOSTILES";
        
        //rval += "\t\t  STARS\t\t\tSTARBASES\n";
        rval += "\t\t  STARS\n";

        let klingonLRSLines = klingonLRS.split('\n');
        let starLRSLines = starLRS.split('\n');
        //let starbaseLRSLines = starbaseLRS.split('\n');

        console.assert(klingonLRSLines.length == starLRSLines.length);
        for (var x in klingonLRSLines)
        {
            //rval += klingonLRSLines[x] + "\t" + starLRSLines[x] + "\t" + starbaseLRSLines[x] + '\n';
            rval += klingonLRSLines[x] + "\t" + starLRSLines[x] + '\n';
        }

        return rval;
    }

    warp(subsectorXEnd, subsectorYEnd, subsectorsToTravel, game)
    {
        let energyRequired = this.warpEnergyCost(subsectorsToTravel);

        if (this.freeEnergy < energyRequired)
        {
            gameOutputAppend("\nNot enough energy free to complete maneuver!");
            return false;
        }

        let intersection = game.currentSector.intersectionTest(this.subsectorX, this.subsectorY, subsectorXEnd, subsectorYEnd)
           
        this.subsectorX = Math.floor(intersection.lastX);
        this.subsectorY = Math.floor(intersection.lastY);

        if (intersection.intersects != null)
        {
            gameOutputAppend("\nObstruction ahead.  Shutting down warp engines.");
        }

        if (!intersection.stepIterations)
        {
            return false;
        }

        let actualEnergy = this.warpEnergyCost(intersection.stepIterations);

        // get the energy cost of the subsectors we actually travelled
        this.freeEnergy -= actualEnergy;

        return true;
    }

    damageReport()
    {
        if (!this.components.LibraryComputer.damageReportAvailable())
        {
            gameOutputAppend("\nDamage report unavailable due to computer damage!");
            return;
        }

        gameOutputAppend("\nDAMAGE REPORT:\n");
        gameOutputAppend("Component Integrity:")
        for (var key in this.components)
        {
            let component = this.components[key];
            gameOutputAppend("" + component.componentName + " : " + Math.round(component.componentHealth * 100) + "%");
        }

        gameOutputAppend("\n\nNOTES:\nRepair crews can repair 1-5% damage per stardate.  A starbase will fully repair a single component every stardate.");

        for (var key in this.components)
        {
            let component = this.components[key];
            component.damageReport();
        }
    }

    static ConstructFromJSData(jsData)
    {
        let rval = Object.create(Enterprise.prototype);
        Object.assign(rval, jsData);

        rval.sensorHistory = new SensorHistory();
        Object.assign(rval.sensorHistory, jsData.sensorHistory);

        rval.createComponents();

        for (var key in rval.components)
        {
            Object.assign(rval.components[key], jsData.components[key]);
        }

        rval.components.ShortRangeSensors.corruptGrid = new Grid();
        rval.components.ShortRangeSensors.corruptGrid.contents = jsData.components.ShortRangeSensors.corruptGrid.contents;
        rval.ensureAdvancedSystemsFields();

        return rval;
    }
}

Enterprise.StartTorpedoes = 10;
Enterprise.StartEnergy = 3000;
Enterprise.StartShields = 0;
Enterprise.TorpedoEnergyCost = 10;
Enterprise.TorpedoOverloadEnergyCost = 40;
Enterprise.TorpedoOverloadSplashDamage = 120;
Enterprise.FocusedPhaserMinimumEnergy = 150;
Enterprise.EnemyScanCost = 10;
Enterprise.PhaserTargets = [Klingon, Borg, Breen, KlingonBattleStation, BreenDampeningArray, BorgTranswarpHub];
Enterprise.EnergyCostPerSubsector = 1.0;        // Warp cost per subsector moved
Enterprise.EnergyCostPerSector = 10.0;          // Warp cost per sector moved
Enterprise.DamagePassthroughRatio = .25;        // if damage is 25% of shields or more, pass damage through to components
Enterprise.RandomPassthroughRatio = .25;        // 25% chance that damage will pass through to ship components regardless of shields
Enterprise.MinComponentRepairPerTurn = 1;       // integrity min autorepair per component
Enterprise.MaxComponentRepairPerTurn = 5;       // integrity max autorepair per component

Enterprise.AdaptiveShieldEnergyCost = 500;
Enterprise.AdaptiveShieldDuration = 3;
Enterprise.AdaptiveShieldCooldownTurns = 6;
Enterprise.AdaptiveShieldDamageMultiplier = .08;
Enterprise.ChronitonLanceChargeCost = 350;
Enterprise.ChronitonLanceChargeDuration = 3;
Enterprise.ChronitonLanceShieldCap = 500;
Enterprise.ChronitonLanceDamage = 900;
Enterprise.ChronitonLanceShockwaveDamage = 120;
Enterprise.ChronitonLanceCooldownTurns = 9;
Enterprise.ChronitonLanceCancelCooldownTurns = 2;
Enterprise.ChronitonLanceEnergyDrain = 200;
Enterprise.TemporalStrainTurns = 3;
Enterprise.TemporalStrainPhaserMissChance = .25;
Enterprise.PhaseCloakEnergyCost = 400;
Enterprise.PhaseCloakDuration = 2;
Enterprise.PhaseCloakCooldownTurns = 6;
Enterprise.PhaseCloakMissChance = .8;
Enterprise.PhaseCloakStrainTurns = 2;
