class StarBase extends GameObject
{
    constructor()
    {
        super(StarBase);
        this.shields = StarBase.StartShields;
        this.integrity = StarBase.StartIntegrity;
        this.disabled = false;
        StarBase.starbaseList.push(this);
    }

    isOperational()
    {
        this.ensureDamageFields();
        return !this.disabled && this.integrity > 0;
    }

    ensureDamageFields()
    {
        if (this.shields == null)
        {
            this.shields = StarBase.StartShields;
        }

        if (this.integrity == null)
        {
            this.integrity = StarBase.StartIntegrity;
        }

        if (this.disabled == null)
        {
            this.disabled = false;
        }
    }

    resupplyEnterprise(enterprise)
    {
        let torpedoesRestored = Enterprise.StartTorpedoes - enterprise.torpedoes;
        let energyBefore = enterprise.freeEnergy;

        enterprise.torpedoes = Enterprise.StartTorpedoes;
        enterprise.freeEnergy = Math.max(0, Enterprise.StartEnergy - enterprise.shields);

        gameOutputAppend("\nSTATION: Starbase resupply complete: restored " + torpedoesRestored + " photon torpedo" + (torpedoesRestored == 1 ? "" : "es") + " and " + (enterprise.freeEnergy - energyBefore) + " free energy.");
    }

    destroyByHostiles(game)
    {
        game.currentSector.removeEntity(this);
        StarBase.Instances--;

        let removeSB = this;
        StarBase.starbaseList = StarBase.starbaseList.filter(function(item){return item != removeSB});

        if (game.enterprise.dockStarbase == removeSB)
        {
            game.enterprise.undock(removeSB);
        }

        game.checkStarbaseDock();
        gameOutputAppend("\nWARNING: Starbase in sector " + this.sectorString() + " has been destroyed. Subspace channels fall silent; repair and resupply capacity is reduced.");
    }

    disable(game)
    {
        if (this.disabled)
        {
            return;
        }

        this.disabled = true;

        if (game.enterprise.dockStarbase == this)
        {
            game.enterprise.undock(this);
        }

        game.checkStarbaseDock();
        gameOutputAppend("\nWARNING: Starbase in sector " + this.sectorString() + " is disabled. Emergency lights only; docking support is offline until the sector is secured.");
    }

    takeDamage(energy, game, fromHostile)
    {
        this.ensureDamageFields();
        if (fromHostile)
        {
            game.stationUnderAttack(this);
            gameOutputAppend("\nWARNING: Hostile fire strikes starbase " + this.subsectorString() + " for " + energy + " units; station shields flare across the sector.");
        }
        else
        {
            gameOutputAppend("\nFriendly fire strikes starbase " + this.subsectorString() + " for " + energy + " units.");
        }

        let remainingEnergy = energy;
        if (this.shields > 0)
        {
            let shieldDamage = Math.min(this.shields, remainingEnergy);
            this.shields -= shieldDamage;
            remainingEnergy -= shieldDamage;
        }

        if (remainingEnergy > 0)
        {
            this.integrity -= remainingEnergy;
        }

        if (this.integrity <= 0)
        {
            this.destroyByHostiles(game);
        }
        else
        {
            if (this.shields <= 0 || this.integrity <= StarBase.DisabledIntegrity)
            {
                this.disable(game);
            }

            gameOutputAppend("STATION: Starbase status: shields " + Math.max(0, this.shields) + ", integrity " + Math.max(0, this.integrity) + ".");
        }
    }

    onPhaserHit(energy, game)
    {
        this.takeDamage(energy, game, true);
    }

    onTorpedoHit(game)
    {
        console.log("hit a starbase");

        gameOutputAppend("\nReport from sector " + this.subsectorString());
        if (game.primeUniverse)
        {
            gameOutputAppend("The torpedo strikes the friendly starbase shields! Starfleet records the incident for disciplinary review.");
        }
        else
        {
            gameOutputAppend("The torpedo strikes the Imperial starbase shields! Starfleet orders your second in command to throw you in the agonizer booth, costing you a Stardate.");
            game.advanceStardate(1.0);
        }

        this.takeDamage(StarBase.PlayerTorpedoDamage, game, false);
    }

    toString()
    {
        return ">!<";
    }

    static maxInstancesSector()
    {
        return 1;
    }

    static minInstancesGame()
    {
        return 1;
    }

    static sectorInstanceProbabilities()
    {
        // 5% chance of a starbase in any given quadrant
        return [.95, .05];
    }
}

StarBase.StartShields = 250;
StarBase.StartIntegrity = 300;
StarBase.DisabledIntegrity = 120;
StarBase.PlayerTorpedoDamage = 250;
StarBase.SupportShieldBoost = 50;
StarBase.starbaseList = [];