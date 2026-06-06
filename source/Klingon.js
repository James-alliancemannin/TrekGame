class HostileEnemy extends GameObject
{
    constructor(className, minShields, maxShields)
    {
        super(className);
        this.shields = randomInt(minShields, maxShields);
        this.moveStep = 0;
    }

    onTorpedoHit(game)
    {
        gameOutputAppend("\nReport from subsector " + this.subsectorString());
        game.destroyHostile(this);
    }

    onTorpedoSplashDamage(energy, game)
    {
        gameOutputAppend("\nTACTICAL: Overload shockwave washes over " + this.enemyDescription(game) + " at subsector " + this.subsectorString() + " for " + energy + " damage.");
        this.shields -= energy;

        if (this.shields <= 0)
        {
            game.destroyHostile(this);
        }
        else if (game.currentSectorScanned && game.enterprise.canSeeEntity(this))
        {
            gameOutputAppend("" + this.shields + " units remain.");
        }
    }

    onTemporalLanceHit(energy, game, shockwave=false)
    {
        gameOutputAppend("\n" + (shockwave ? "Temporal shockwave strikes " : "Temporal discharge tears through ") + this.enemyDescription(game) + " at subsector " + this.subsectorString() + " for " + energy + " damage.");
        this.shields -= energy;

        if (this.shields <= 0)
        {
            game.destroyHostile(this);
        }
        else if (game.currentSectorScanned && game.enterprise.canSeeEntity(this))
        {
            gameOutputAppend("" + this.shields + " units remain.");
        }
    }

    onPhaserHit(energy, game)
    {
        let shieldDeflectionLevel = this.constructor.shieldDeflectionPercent * this.shields;

        gameOutputAppend("\nReport from subsector " + this.subsectorString());

        if (energy <= shieldDeflectionLevel)
        {
            gameOutputAppend("Phaser hit did no damage!");
        }
        else
        {
            gameOutputAppend("Phaser hit the " + this.enemyDescription(game) + " for " + energy + " damage.");

            this.shields -= energy;

            if (this.shields <= 0)
            {
                game.destroyHostile(this);
            }
            else
            {
                if (game.currentSectorScanned)
                {
                    if (game.enterprise.canSeeEntity(this))
                    {
                       gameOutputAppend("" + this.shields + " units remain.");
                    }
                    else
                    {
                        gameOutputAppend("Sensor damage prevents reading the enemy's shields!");
                    }
                }
            }
        }
    }

    enemyDescription(game)
    {
        return this.constructor.displayName.toLowerCase() + " vessel";
    }

    phaserDamageBase(dist)
    {
        let energyToFire = this.shields;
        return Math.round(energyToFire / dist);
    }

    firePhasers(target, game, phaseCloakChecked=false)
    {
        if (!phaseCloakChecked && target.constructor == Enterprise && target.phaseCloakEvadesAttack())
        {
            let cloakSubsector = game.enterprise.canSeeEntity(this) ? this.subsectorString() : " ???? ";
            gameOutputAppend("\n" + this.constructor.displayName + " fire from subsector " + cloakSubsector + " passes through the Enterprise phase shadow.");
            return false;
        }

        let dist = this.distanceToObject(target);
        let phaserDamage = this.phaserDamageBase(dist) * randomInt(this.constructor.MinPhaserMultiplier, this.constructor.MaxPhaserMultiplier);

        let sstr = game.enterprise.canSeeEntity(this) ? this.subsectorString() : " ???? ";
        gameOutputAppend("\n" + this.constructor.displayName + " hit from subsector " + sstr + " for " + phaserDamage + " units");
        target.onPhaserHit(phaserDamage, game);
        return true;
    }

    minPhaserDamage()
    {
        return this.constructor.MinPhaserMultiplier * this.phaserDamageBase(1);
    }
    
    maxPhaserDamage()
    {
        return this.constructor.MaxPhaserMultiplier * this.phaserDamageBase(1);
    }

    toString()
    {
        return this.constructor.stringRepresentation;
    }

    shouldMove(game)
    {
        return true;
    }


    closestOperationalStarbase(game)
    {
        let starbases = game.currentSector.getEntitiesOfType(StarBase).filter(function(starbase){return starbase.isOperational();});
        if (!starbases.length)
        {
            return null;
        }

        let hostile = this;
        starbases.sort(function(a, b){return hostile.distanceToObject(a) - hostile.distanceToObject(b);});
        return starbases[0];
    }

    stationMovementCandidates(game)
    {
        let station = this.closestOperationalStarbase(game);
        if (!station)
        {
            return [];
        }

        let xdir = Math.sign(station.subsectorX - this.subsectorX);
        let ydir = Math.sign(station.subsectorY - this.subsectorY);
        let candidates = [];

        if (xdir != 0 || ydir != 0)
        {
            candidates.push({x : this.subsectorX + xdir, y : this.subsectorY + ydir});
        }
        if (xdir != 0)
        {
            candidates.push({x : this.subsectorX + xdir, y : this.subsectorY});
        }
        if (ydir != 0)
        {
            candidates.push({x : this.subsectorX, y : this.subsectorY + ydir});
        }

        return candidates;
    }

    selectTarget(game)
    {
        return game.enterprise;
    }

    movementCandidates(game)
    {
        return this.towardEnterpriseMovementCandidates(game);
    }

    towardEnterpriseMovementCandidates(game)
    {
        let xdir = Math.sign(game.enterprise.subsectorX - this.subsectorX);
        let ydir = Math.sign(game.enterprise.subsectorY - this.subsectorY);

        let candidates = [];

        if (xdir != 0 || ydir != 0)
        {
            candidates.push({x : this.subsectorX + xdir, y : this.subsectorY + ydir});
        }
        if (xdir != 0)
        {
            candidates.push({x : this.subsectorX + xdir, y : this.subsectorY});
        }
        if (ydir != 0)
        {
            candidates.push({x : this.subsectorX, y : this.subsectorY + ydir});
        }

        return candidates;
    }

    moveEnemy(game)
    {
        this.moveStep++;

        if (!this.shouldMove(game))
        {
            return false;
        }

        let candidates = this.movementCandidates(game);
        for (var x in candidates)
        {
            let candidate = candidates[x];
            if (game.currentSector.moveEntity(this, candidate.x, candidate.y))
            {
                return true;
            }
        }

        return false;
    }
}

class Klingon extends HostileEnemy
{
    constructor()
    {
        super(Klingon, 100, 300);
    }

    enemyDescription(game)
    {
        return game.primeUniverse ? "klingon fighter" : "enemy ship";
    }

    selectTarget(game)
    {
        let station = this.closestOperationalStarbase(game);
        if (station && this.distanceToObject(station) <= Klingon.StationAttackRange && Math.random() < Klingon.StationAttackChance)
        {
            return station;
        }

        return game.enterprise;
    }

    firePhasers(target, game)
    {
        if (target.constructor == Enterprise && target.phaseCloakEvadesAttack())
        {
            let cloakSubsector = game.enterprise.canSeeEntity(this) ? this.subsectorString() : " ???? ";
            gameOutputAppend("\n" + this.constructor.displayName + " fire from subsector " + cloakSubsector + " passes through the Enterprise phase shadow.");
            return false;
        }

        let dist = this.distanceToObject(target);
        if (target.constructor == Enterprise && dist <= Klingon.AggressiveStrikeRange && Math.random() < Klingon.AggressiveStrikeChance)
        {
            let phaserDamage = Math.round(this.phaserDamageBase(dist) * Klingon.AggressiveStrikeMultiplier * randomInt(Klingon.MinPhaserMultiplier, Klingon.MaxPhaserMultiplier));
            let sstr = game.enterprise.canSeeEntity(this) ? this.subsectorString() : " ???? ";
            gameOutputAppend("\nRED ALERT: Klingon close assault from subsector " + sstr + " for " + phaserDamage + " units; evasive pattern compromised.");
            target.onPhaserHit(phaserDamage, game);
            return true;
        }

        return super.firePhasers(target, game, true);
    }
    
    static maxInstancesSector()
    {
        return 4;
    }

    static sectorInstanceProbabilities()
    {
        return [.9,     // %chance 0 klingons
                .025,
                .025,
                .0125,
                .00625  // %chance 4 klingons
        ];
    }

    static maxInstancesGame()
    {
        return 18;
    }

    static minInstancesGame()
    {
        return minKlingonsGame;
    }
}

class Borg extends HostileEnemy
{
    constructor()
    {
        super(Borg, 350, 600);
        this.phaserResistance = 0;
    }

    onPhaserHit(energy, game)
    {
        this.phaserResistance = this.phaserResistance || 0;

        let adjustedEnergy = Math.floor(energy * (1.0 - this.phaserResistance));
        if (this.phaserResistance > 0)
        {
            gameOutputAppend("\nWARNING: Borg adaptation matrix reduces phaser damage by " + Math.round(100 * this.phaserResistance) + "%.");
        }

        super.onPhaserHit(adjustedEnergy, game);

        if (this.shields > 0)
        {
            let oldResistance = this.phaserResistance;
            this.phaserResistance = Math.min(Borg.MaxPhaserResistance, this.phaserResistance + Borg.PhaserResistanceStep);
            if (this.phaserResistance > oldResistance)
            {
                gameOutputAppend("WARNING: Borg shields adapt to the phaser frequency. Phaser resistance is now " + Math.round(100 * this.phaserResistance) + "%.");
            }
        }
    }

    selectTarget(game)
    {
        let station = this.closestOperationalStarbase(game);
        if (station && Math.random() < Borg.StationTargetChance)
        {
            return station;
        }

        return game.enterprise;
    }

    movementCandidates(game)
    {
        if (Math.random() < Borg.StationTargetChance)
        {
            let candidates = this.stationMovementCandidates(game);
            if (candidates.length)
            {
                return candidates;
            }
        }

        return super.movementCandidates(game);
    }

    shouldMove(game)
    {
        return (this.moveStep % 2) == 0;
    }

    static maxInstancesSector()
    {
        return 2;
    }

    static sectorInstanceProbabilities()
    {
        return [.96, .03, .01];
    }

    static maxInstancesGame()
    {
        return 6;
    }

    static minInstancesGame()
    {
        return 2;
    }
}

class Breen extends HostileEnemy
{
    constructor()
    {
        super(Breen, 180, 360);
    }

    firePhasers(target, game)
    {
        let attackHit = super.firePhasers(target, game);

        if (!attackHit || target.constructor == StarBase)
        {
            if (attackHit && target.isOperational() && Math.random() < Breen.StationDisruptionChance)
            {
                target.disable(game);
                gameOutputAppend("\nDISRUPTION: Breen energy dampener disrupts starbase support and nearby sensors!");
            }
            return;
        }

        let disruptionChance = Breen.DisruptionChance;
        target.ensureAdvancedSystemsFields();
        if (target.adaptiveShieldTurns > 0)
        {
            disruptionChance *= Breen.AdaptiveMatrixDisruptionMultiplier;
        }

        if (!target.isDestroyed() && Math.random() < disruptionChance)
        {
            let disruptionTargets = [target.components.ShortRangeSensors, target.components.PhaserControl, target.components.PhotonTubes];
            let component = disruptionTargets[randomInt(0, disruptionTargets.length - 1)];
            component.disruptTemporarily(Breen.DisruptionTurns);

            if (component == target.components.ShortRangeSensors)
            {
                component.generateCorruptGrid();
                gameOutputAppend("\nDISRUPTION: Breen energy dampener spike corrupts short-range sensors temporarily!");
            }
            else if (component == target.components.PhaserControl)
            {
                gameOutputAppend("\nDISRUPTION: Breen energy wake scrambles phaser targeting temporarily!");
            }
            else
            {
                gameOutputAppend("\nDISRUPTION: Breen energy wake destabilizes photon torpedo targeting temporarily!");
            }
        }
    }

    movementCandidates(game)
    {
        let candidates = [];
        let xdiff = game.enterprise.subsectorX - this.subsectorX;
        let ydiff = game.enterprise.subsectorY - this.subsectorY;

        if (Math.random() < Breen.ChanceMoveTowardEnterprise)
        {
            candidates.push(...this.towardEnterpriseMovementCandidates(game));
        }

        if (Math.abs(xdiff) >= Math.abs(ydiff))
        {
            candidates.push({x : this.subsectorX, y : this.subsectorY + 1});
            candidates.push({x : this.subsectorX, y : this.subsectorY - 1});
        }
        else
        {
            candidates.push({x : this.subsectorX + 1, y : this.subsectorY});
            candidates.push({x : this.subsectorX - 1, y : this.subsectorY});
        }

        candidates.push({x : this.subsectorX + randomInt(-1, 1), y : this.subsectorY + randomInt(-1, 1)});
        candidates.push(...this.towardEnterpriseMovementCandidates(game));

        return candidates;
    }

    static maxInstancesSector()
    {
        return 3;
    }

    static sectorInstanceProbabilities()
    {
        return [.94, .04, .015, .005];
    }

    static maxInstancesGame()
    {
        return 10;
    }

    static minInstancesGame()
    {
        return 3;
    }
}

Klingon.shieldDeflectionPercent = .15;
Klingon.InstancesDestroyed = 0;
Klingon.MaxPhaserMultiplier = 3;
Klingon.MinPhaserMultiplier = 2;
Klingon.displayName = "Klingon";
Klingon.stringRepresentation = "+K+";
Klingon.AggressiveStrikeRange = 3;
Klingon.AggressiveStrikeChance = .2;
Klingon.AggressiveStrikeMultiplier = 1.35;
Klingon.StationAttackRange = 3;
Klingon.StationAttackChance = .35;

Borg.shieldDeflectionPercent = .25;
Borg.InstancesDestroyed = 0;
Borg.MaxPhaserMultiplier = 2;
Borg.MinPhaserMultiplier = 1;
Borg.displayName = "Borg";
Borg.stringRepresentation = "+B+";
Borg.PhaserResistanceStep = .1;
Borg.MaxPhaserResistance = .45;
Borg.StationTargetChance = .35;

Breen.shieldDeflectionPercent = .18;
Breen.InstancesDestroyed = 0;
Breen.MaxPhaserMultiplier = 3;
Breen.MinPhaserMultiplier = 1;
Breen.displayName = "Breen";
Breen.stringRepresentation = "+R+";
Breen.ChanceMoveTowardEnterprise = .25;
Breen.DisruptionChance = .18;
Breen.DisruptionTurns = 1;
Breen.StationDisruptionChance = .35;

Breen.AdaptiveMatrixDisruptionMultiplier = .35;
